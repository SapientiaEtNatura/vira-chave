import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  }),
  z.object({
    kind: z.literal("question"),
    prompt: z.string().trim().min(5, "Informe o enunciado da pergunta.").max(400),
    order: z.coerce.number().int().min(1, "Ordem deve ser maior que zero."),
    weightsByArea: z.record(z.string(), z.coerce.number().int().min(0).max(10)),
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
    externalUrl: z.string().trim().url("Informe uma URL externa válida."),
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
  }),
  z.object({
    kind: z.literal("question"),
    id: z.string().trim().min(1),
    prompt: z.string().trim().min(5).max(400).optional(),
    order: z.coerce.number().int().min(1).optional(),
    weightsByArea: z.record(z.string(), z.coerce.number().int().min(0).max(10)).optional(),
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
    externalUrl: z.string().trim().url().optional(),
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
    questions,
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
    switch (data.kind) {
      case "macroArea": {
        const item = await prisma.macroArea.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
          },
        });
        return NextResponse.json({ item }, { status: 201 });
      }
      case "question": {
        const item = await prisma.discoveryQuestion.create({
          data: {
            prompt: data.prompt,
            order: data.order,
            weightsByArea: data.weightsByArea,
          },
        });
        return NextResponse.json({ item }, { status: 201 });
      }
      case "track": {
        const item = await prisma.track.create({
          data: {
            macroAreaId: data.macroAreaId,
            title: data.title,
            description: data.description,
            published: data.published,
          },
          include: { macroArea: { select: { id: true, name: true, slug: true } } },
        });
        return NextResponse.json({ item }, { status: 201 });
      }
      case "courseItem": {
        const item = await prisma.courseItem.create({
          data: {
            trackId: data.trackId,
            title: data.title,
            providerName: data.providerName,
            externalUrl: data.externalUrl,
            order: data.order,
          },
          include: { track: { select: { id: true, title: true } } },
        });
        return NextResponse.json({ item }, { status: 201 });
      }
      case "challenge": {
        const item = await prisma.challenge.create({
          data: {
            macroAreaId: data.macroAreaId,
            title: data.title,
            description: data.description,
            published: data.published,
          },
          include: { macroArea: { select: { id: true, name: true, slug: true } } },
        });
        return NextResponse.json({ item }, { status: 201 });
      }
    }
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) return handled;
    throw error;
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
    switch (data.kind) {
      case "macroArea": {
        const item = await prisma.macroArea.update({
          where: { id: data.id },
          data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.slug !== undefined ? { slug: data.slug } : {}),
            ...(data.description !== undefined
              ? { description: data.description }
              : {}),
          },
        });
        return NextResponse.json({ item });
      }
      case "question": {
        const item = await prisma.discoveryQuestion.update({
          where: { id: data.id },
          data: {
            ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
            ...(data.order !== undefined ? { order: data.order } : {}),
            ...(data.weightsByArea !== undefined
              ? { weightsByArea: data.weightsByArea }
              : {}),
          },
        });
        return NextResponse.json({ item });
      }
      case "track": {
        const item = await prisma.track.update({
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
        return NextResponse.json({ item });
      }
      case "courseItem": {
        const item = await prisma.courseItem.update({
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
        return NextResponse.json({ item });
      }
      case "challenge": {
        const item = await prisma.challenge.update({
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
        return NextResponse.json({ item });
      }
    }
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) return handled;
    throw error;
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
    return NextResponse.json({ deleted: true, kind, id });
  } catch (error) {
    const handled = handlePrismaError(error);
    if (handled) return handled;
    throw error;
  }
}
