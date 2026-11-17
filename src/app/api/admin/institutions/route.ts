import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";

const MAX_CODE_RETRIES = 5;

const createInstitutionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da instituição (mínimo 2 caracteres).")
    .max(160, "Nome da instituição muito longo."),
  institutionCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9-]{3,32}$/,
      "Código institucional deve ter 3 a 32 caracteres (letras, números ou hífen).",
    )
    .optional()
    .or(z.literal("")),
});

const patchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("institution"),
    id: z.string().trim().min(1, "ID da instituição é obrigatório."),
    active: z.boolean(),
  }),
  z.object({
    kind: z.literal("educator"),
    id: z.string().trim().min(1, "ID do educador é obrigatório."),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
  }),
]);

function generateInstitutionCode(): string {
  const token = randomBytes(3).toString("hex").toUpperCase();
  return `INST-${token}`;
}

export async function GET() {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const [institutions, educators] = await Promise.all([
    prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        institutionCode: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            classrooms: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.EDUCADOR },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        institutionId: true,
        createdAt: true,
        institution: {
          select: { id: true, name: true, active: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    institutions: institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      institutionCode: inst.institutionCode,
      active: inst.active,
      createdAt: inst.createdAt.toISOString(),
      userCount: inst._count.users,
      classroomCount: inst._count.classrooms,
    })),
    educators: educators.map((edu) => ({
      id: edu.id,
      name: edu.name,
      email: edu.email,
      status: edu.status,
      institutionId: edu.institutionId,
      institutionName: edu.institution?.name ?? null,
      institutionActive: edu.institution?.active ?? null,
      createdAt: edu.createdAt.toISOString(),
    })),
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

  const parsed = createInstitutionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const customCode =
    parsed.data.institutionCode && parsed.data.institutionCode.length > 0
      ? parsed.data.institutionCode
      : null;

  const attempts = customCode ? 1 : MAX_CODE_RETRIES;
  for (let i = 0; i < attempts; i += 1) {
    const code = customCode ?? generateInstitutionCode();
    try {
      const institution = await prisma.institution.create({
        data: {
          name: parsed.data.name,
          institutionCode: code,
          active: true,
        },
        select: {
          id: true,
          name: true,
          institutionCode: true,
          active: true,
          createdAt: true,
          _count: {
            select: { users: true, classrooms: true },
          },
        },
      });

      await recordAuditLog({
        actorId: authResult.userId,
        actorRole: authResult.role,
        action: AUDIT_ACTIONS.INSTITUTION_CREATED,
        targetType: "Institution",
        targetId: institution.id,
        metadata: {
          institutionCode: institution.institutionCode,
          active: institution.active,
        },
      });

      return NextResponse.json(
        {
          institution: {
            id: institution.id,
            name: institution.name,
            institutionCode: institution.institutionCode,
            active: institution.active,
            createdAt: institution.createdAt.toISOString(),
            userCount: institution._count.users,
            classroomCount: institution._count.classrooms,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        if (customCode) {
          return NextResponse.json(
            { error: "Já existe uma instituição com este código." },
            { status: 409 },
          );
        }
        continue;
      }
      throw error;
    }
  }

  return NextResponse.json(
    { error: "Não foi possível gerar um código institucional único." },
    { status: 500 },
  );
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

  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    if (data.kind === "institution") {
      // Desativar a instituição bloqueia apenas novos cadastros; contas já vinculadas continuam intactas.
      const institution = await prisma.institution.update({
        where: { id: data.id },
        data: { active: data.active },
        select: {
          id: true,
          name: true,
          institutionCode: true,
          active: true,
          createdAt: true,
          _count: {
            select: { users: true, classrooms: true },
          },
        },
      });

      await recordAuditLog({
        actorId: authResult.userId,
        actorRole: authResult.role,
        action: AUDIT_ACTIONS.INSTITUTION_UPDATED,
        targetType: "Institution",
        targetId: institution.id,
        metadata: { active: institution.active },
      });

      return NextResponse.json({
        institution: {
          id: institution.id,
          name: institution.name,
          institutionCode: institution.institutionCode,
          active: institution.active,
          createdAt: institution.createdAt.toISOString(),
          userCount: institution._count.users,
          classroomCount: institution._count.classrooms,
        },
      });
    }

    const existing = await prisma.user.findUnique({
      where: { id: data.id },
      select: { id: true, role: true, status: true },
    });

    if (!existing || existing.role !== Role.EDUCADOR) {
      return NextResponse.json(
        { error: "Educador não encontrado." },
        { status: 404 },
      );
    }

    const educator = await prisma.user.update({
      where: { id: data.id },
      data: {
        status: data.status,
        ...(data.status !== existing.status
          ? { tokenVersion: { increment: 1 } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        institutionId: true,
        createdAt: true,
        institution: {
          select: { id: true, name: true, active: true },
        },
      },
    });

    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.INSTITUTION_UPDATED,
      targetType: "User",
      targetId: educator.id,
      metadata: {
        kind: "educator",
        status: educator.status,
      },
    });

    return NextResponse.json({
      educator: {
        id: educator.id,
        name: educator.name,
        email: educator.email,
        status: educator.status,
        institutionId: educator.institutionId,
        institutionName: educator.institution?.name ?? null,
        institutionActive: educator.institution?.active ?? null,
        createdAt: educator.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Registro não encontrado." },
        { status: 404 },
      );
    }
    throw error;
  }
}
