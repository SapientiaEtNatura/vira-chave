import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  deriveQuestionAreaWeights,
  isSafeAreaSlug,
  parseQuestionOptions,
} from "@/lib/discovery/types";
import { validateExternalUrlStructure } from "@/lib/link-checker";
import { requireApiRole } from "@/lib/rbac";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const entryRolesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(2, "Cada atuação de entrada deve ter entre 2 e 60 caracteres.")
      .max(60, "Cada atuação de entrada deve ter entre 2 e 60 caracteres."),
  )
  .max(8, "Informe no máximo 8 atuações de entrada.");

const questionOptionSchema = z.object({
  id: z.string().trim().min(1, "Informe o identificador de cada opção."),
  label: z
    .string()
    .trim()
    .min(5, "O texto de cada opção deve ter entre 5 e 220 caracteres.")
    .max(220, "O texto de cada opção deve ter entre 5 e 220 caracteres."),
  weightsByArea: z
    .unknown()
    .superRefine((val, ctx) => {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        for (const key of Object.getOwnPropertyNames(val)) {
          if (!isSafeAreaSlug(key)) {
            ctx.addIssue({
              code: "custom",
              message: "Identificador de MacroÁrea inválido.",
            });
            return;
          }
        }
      }
    })
    .pipe(
      z
        .record(
          z
            .string()
            .trim()
            .min(1)
            .refine(isSafeAreaSlug, "Identificador de MacroÁrea inválido."),
          z
            .number({
              message: "Cada peso deve ser um número inteiro entre 0 e 10.",
            })
            .int("Cada peso deve ser um número inteiro entre 0 e 10.")
            .min(0)
            .max(10),
        )
        .refine(
          (weights) => Object.values(weights).some((weight) => weight > 0),
          "Cada opção deve atribuir peso maior que zero a pelo menos uma MacroÁrea.",
        ),
    ),
});

const questionOptionsArraySchema = z
  .array(questionOptionSchema)
  .min(2, "Informe entre 2 e 4 opções situacionais.")
  .max(4, "Informe entre 2 e 4 opções situacionais.")
  .refine(
    (options) => new Set(options.map((opt) => opt.id)).size === options.length,
    "Os identificadores das opções devem ser únicos.",
  );

function serializeQuestion<T extends { optionsJson: unknown }>(question: T) {
  return {
    ...question,
    options: parseQuestionOptions(question.optionsJson),
  };
}

const httpExternalUrlSchema = z
  .string()
  .trim()
  .url("Informe uma URL externa válida.")
  .refine(
    (value) => validateExternalUrlStructure(value).safe,
    "URL externa inválida ou aponta para endereço interno não permitido.",
  );

const createContentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("macroArea"),
    name: z.string().trim().min(2, "Informe o nome da macroárea.").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Informe um slug válido.")
      .max(80)
      .regex(slugRegex, "Slug deve conter apenas letras minúsculas, números e hífens."),
    description: z.string().trim().min(4, "Informe uma descrição.").max(500),
    entryRoles: entryRolesSchema.optional().default([]),
  }),
  z.object({
    kind: z.literal("question"),
    prompt: z.string().trim().min(5, "Informe o enunciado da pergunta.").max(400),
    order: z.coerce.number().int().min(1, "Ordem deve ser maior que zero."),
    options: questionOptionsArraySchema,
  }),
  z.object({
    kind: z.literal("track"),
    macroAreaId: z.string().trim().min(1, "Selecione uma macroárea."),
    title: z.string().trim().min(2, "Informe o título da trilha.").max(160),
    description: z.string().trim().min(4, "Informe uma descrição.").max(600),
    published: z.boolean().optional().default(true),
  }),
  z.object({
    kind: z.literal("courseItem"),
    trackId: z.string().trim().min(1, "Selecione uma trilha."),
    title: z.string().trim().min(2, "Informe o título do curso.").max(160),
    providerName: z.string().trim().min(2, "Informe o provedor.").max(100),
    externalUrl: httpExternalUrlSchema,
    order: z.coerce.number().int().min(1, "Ordem deve ser maior que zero."),
  }),
  z.object({
    kind: z.literal("challenge"),
    macroAreaId: z.string().trim().min(1, "Selecione uma macroárea."),
    title: z.string().trim().min(2, "Informe o título do desafio.").max(160),
    description: z.string().trim().min(4, "Informe uma descrição.").max(1000),
    published: z.boolean().optional().default(true),
  }),
]);

const updateContentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("macroArea"),
    id: z.string().trim().min(1),
    name: z.string().trim().min(2).max(120).optional(),
    slug: z.string().trim().toLowerCase().min(2).max(80).regex(slugRegex).optional(),
    description: z.string().trim().min(4).max(500).optional(),
    entryRoles: entryRolesSchema.optional(),
  }),
  z.object({
    kind: z.literal("question"),
    id: z.string().trim().min(1),
    prompt: z.string().trim().min(5).max(400).optional(),
    order: z.coerce.number().int().min(1).optional(),
    options: questionOptionsArraySchema.optional(),
  }),
  z.object({
    kind: z.literal("track"),
    id: z.string().trim().min(1),
    macroAreaId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().min(4).max(600).optional(),
    published: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("courseItem"),
    id: z.string().trim().min(1),
    trackId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(2).max(160).optional(),
    providerName: z.string().trim().min(2).max(100).optional(),
    externalUrl: httpExternalUrlSchema.optional(),
    order: z.coerce.number().int().min(1).optional(),
  }),
  z.object({
    kind: z.literal("challenge"),
    id: z.string().trim().min(1),
    macroAreaId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().min(4).max(1000).optional(),
    published: z.boolean().optional(),
  }),
]);

const deleteContentSchema = z.object({
  kind: z.enum(["macroArea", "question", "track", "courseItem", "challenge"]),
  id: z.string().trim().min(1, "ID obrigatório."),
});

function handlePrismaError(error: unknown): NextResponse | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }
  if (error.code === "P2002") {
    return NextResponse.json(
      { error: "Já existe um registro com este identificador ou ordem única." },
      { status: 409 },
    );
  }
  if (error.code === "P2025") {
    return NextResponse.json(
      { error: "Registro não encontrado." },
      { status: 404 },
    );
  }
  if (error.code === "P2003") {
    return NextResponse.json(
      { error: "Referência inválida (macroárea ou trilha não encontrada)." },
      { status: 400 },
    );
  }
  return null;
}

export async function GET() {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const [macroAreas, questions, tracks, courseItems, challenges] =
    await Promise.all([
      prisma.macroArea.findMany({ orderBy: { name: "asc" } }),
      prisma.discoveryQuestion.findMany({ orderBy: { order: "asc" } }),
      prisma.track.findMany({
        orderBy: { title: "asc" },
        include: { macroArea: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.courseItem.findMany({
        orderBy: [{ trackId: "asc" }, { order: "asc" }],
        include: { track: { select: { id: true, title: true } } },
      }),
      prisma.challenge.findMany({
        orderBy: { title: "asc" },
        include: { macroArea: { select: { id: true, name: true, slug: true } } },
      }),
    ]);

  return NextResponse.json({
    macroAreas,
    questions: questions.map(serializeQuestion),
    tracks,
    courseItems,
    challenges,
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = createContentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    let item: { id: string };
    switch (data.kind) {
      case "macroArea": {
        item = await prisma.macroArea.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            entryRoles: data.entryRoles,
          },
        });
        break;
      }
      case "question": {
        const created = await prisma.discoveryQuestion.create({
          data: {
            prompt: data.prompt,
            order: data.order,
            optionsJson: data.options as unknown as Prisma.InputJsonValue,
            weightsByArea: deriveQuestionAreaWeights(data.options),
          },
        });
        item = serializeQuestion(created);
        break;
      }
      case "track": {
        item = await prisma.track.create({
          data: {
            macroAreaId: data.macroAreaId,
            title: data.title,
            description: data.description,
            published: data.published,
          },
          include: { macroArea: { select: { id: true, name: true, slug: true } } },
        });
        break;
      }
      case "courseItem": {
        item = await prisma.courseItem.create({
          data: {
            trackId: data.trackId,
            title: data.title,
            providerName: data.providerName,
            externalUrl: data.externalUrl,
            order: data.order,
          },
          include: { track: { select: { id: true, title: true } } },
        });
        break;
      }
      case "challenge": {
        item = await prisma.challenge.create({
          data: {
            macroAreaId: data.macroAreaId,
            title: data.title,
            description: data.description,
            published: data.published,
          },
          include: { macroArea: { select: { id: true, name: true, slug: true } } },
        });
        break;
      }
    }

    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.CONTENT_CREATED,
      targetType: data.kind,
      targetId: item.id,
      metadata: { kind: data.kind },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) return handled;
    return NextResponse.json(
      { error: "Erro interno ao processar conteúdo." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = updateContentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    let item: { id: string };
    switch (data.kind) {
      case "macroArea": {
        item = await prisma.macroArea.update({
          where: { id: data.id },
          data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.slug !== undefined ? { slug: data.slug } : {}),
            ...(data.description !== undefined
              ? { description: data.description }
              : {}),
            ...(data.entryRoles !== undefined
              ? { entryRoles: data.entryRoles }
              : {}),
          },
        });
        break;
      }
      case "question": {
        const updated = await prisma.discoveryQuestion.update({
          where: { id: data.id },
          data: {
            ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
            ...(data.order !== undefined ? { order: data.order } : {}),
            ...(data.options !== undefined
              ? {
                  optionsJson: data.options as unknown as Prisma.InputJsonValue,
                  weightsByArea: deriveQuestionAreaWeights(data.options),
                }
              : {}),
          },
        });
        item = serializeQuestion(updated);
        break;
      }
      case "track": {
        item = await prisma.track.update({
          where: { id: data.id },
          data: {
            ...(data.macroAreaId !== undefined
              ? { macroAreaId: data.macroAreaId }
              : {}),
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.description !== undefined
              ? { description: data.description }
              : {}),
            ...(data.published !== undefined ? { published: data.published } : {}),
          },
          include: { macroArea: { select: { id: true, name: true, slug: true } } },
        });
        break;
      }
      case "courseItem": {
        item = await prisma.courseItem.update({
          where: { id: data.id },
          data: {
            ...(data.trackId !== undefined ? { trackId: data.trackId } : {}),
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.providerName !== undefined
              ? { providerName: data.providerName }
              : {}),
            ...(data.externalUrl !== undefined
              ? { externalUrl: data.externalUrl }
              : {}),
            ...(data.order !== undefined ? { order: data.order } : {}),
          },
          include: { track: { select: { id: true, title: true } } },
        });
        break;
      }
      case "challenge": {
        item = await prisma.challenge.update({
          where: { id: data.id },
          data: {
            ...(data.macroAreaId !== undefined
              ? { macroAreaId: data.macroAreaId }
              : {}),
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.description !== undefined
              ? { description: data.description }
              : {}),
            ...(data.published !== undefined ? { published: data.published } : {}),
          },
          include: { macroArea: { select: { id: true, name: true, slug: true } } },
        });
        break;
      }
    }

    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.CONTENT_UPDATED,
      targetType: data.kind,
      targetId: item.id,
      metadata: { kind: data.kind },
    });

    return NextResponse.json({ item });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) return handled;
    return NextResponse.json(
      { error: "Erro interno ao processar conteúdo." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = deleteContentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { kind, id } = parsed.data;
  try {
    switch (kind) {
      case "macroArea":
        await prisma.macroArea.delete({ where: { id } });
        break;
      case "question":
        await prisma.discoveryQuestion.delete({ where: { id } });
        break;
      case "track":
        await prisma.track.delete({ where: { id } });
        break;
      case "courseItem":
        await prisma.courseItem.delete({ where: { id } });
        break;
      case "challenge":
        await prisma.challenge.delete({ where: { id } });
        break;
    }
    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.CONTENT_DELETED,
      targetType: kind,
      targetId: id,
      metadata: { kind },
    });

    return NextResponse.json({ deleted: true, kind, id });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) return handled;
    return NextResponse.json(
      { error: "Erro interno ao processar conteúdo." },
      { status: 500 },
    );
  }
}
