import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";

const MAX_CODE_RETRIES = 5;

const classroomSelect = {
  id: true,
  name: true,
  inviteCode: true,
  active: true,
  createdAt: true,
  institution: {
    select: {
      id: true,
      name: true,
      institutionCode: true,
      active: true,
    },
  },
  educator: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      enrollments: true,
    },
  },
} satisfies Prisma.ClassroomSelect;

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  institutionId: z.string().trim().min(1).optional(),
});

const patchClassroomSchema = z
  .object({
    classroomId: z.string().trim().min(1, "ID da turma é obrigatório."),
    active: z.boolean().optional(),
    regenerateCode: z.boolean().optional(),
  })
  .refine(
    (data) => data.active !== undefined || data.regenerateCode === true,
    { message: "Informe uma ação válida para atualizar a turma." },
  );

function generateInviteCode(): string {
  return `TURMA-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function GET(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    institutionId: searchParams.get("institutionId") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parâmetros de busca inválidos." },
      { status: 400 },
    );
  }

  const { q, institutionId } = parsed.data;

  try {
    const classrooms = await prisma.classroom.findMany({
      where: {
        ...(institutionId ? { institutionId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { inviteCode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: classroomSelect,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      classrooms: classrooms.map((classroom) => ({
        ...classroom,
        createdAt: classroom.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao carregar turmas." },
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

  const parsed = patchClassroomSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { classroomId, active, regenerateCode } = parsed.data;
  const attempts = regenerateCode ? MAX_CODE_RETRIES : 1;

  for (let i = 0; i < attempts; i += 1) {
    const newCode = regenerateCode ? generateInviteCode() : undefined;
    try {
      const updated = await prisma.classroom.update({
        where: { id: classroomId },
        data: {
          ...(active !== undefined ? { active } : {}),
          ...(newCode !== undefined ? { inviteCode: newCode } : {}),
        },
        select: classroomSelect,
      });

      await recordAuditLog({
        actorId: authResult.userId,
        actorRole: authResult.role,
        action: AUDIT_ACTIONS.CLASSROOM_UPDATED,
        targetType: "Classroom",
        targetId: updated.id,
        metadata: {
          ...(active !== undefined ? { active: updated.active } : {}),
          regeneratedCode: Boolean(regenerateCode),
        },
      });

      return NextResponse.json({
        classroom: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return NextResponse.json(
            { error: "Turma não encontrada." },
            { status: 404 },
          );
        }
        if (error.code === "P2002" && regenerateCode) {
          continue;
        }
      }
      return NextResponse.json(
        { error: "Erro interno ao atualizar turma." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Não foi possível gerar um novo código de convite único." },
    { status: 500 },
  );
}
