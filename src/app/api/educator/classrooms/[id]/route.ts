import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClassroomEducationalView } from "@/lib/educator/classroom-analytics";
import { requireApiRole, EDUCATOR_PORTAL_ROLES } from "@/lib/rbac";

const updateClassroomSchema = z
  .object({
    active: z.boolean({ message: "Valor de status inválido." }).optional(),
    name: z
      .string({ message: "Nome da turma inválido." })
      .trim()
      .min(2, "Informe um nome de turma válido (entre 2 e 120 caracteres).")
      .max(120, "Informe um nome de turma válido (entre 2 e 120 caracteres).")
      .optional(),
  })
  .refine((data) => data.active !== undefined || data.name !== undefined, {
    message: "Nenhuma alteração válida informada.",
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole(EDUCATOR_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Identificador da turma inválido." },
      { status: 400 },
    );
  }

  try {
    const view = await getClassroomEducationalView(id, authResult.userId);
    if (!view) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ view });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar a turma." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole(EDUCATOR_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Identificador da turma inválido." },
      { status: 400 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo JSON inválido." },
      { status: 400 },
    );
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json(
      { error: "Corpo JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = updateClassroomSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.classroom.findUnique({
      where: { id },
      select: { id: true, educatorId: true },
    });

    if (!existing || existing.educatorId !== authResult.userId) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    const updated = await prisma.classroom.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.active !== undefined
          ? { active: parsed.data.active }
          : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        active: true,
        createdAt: true,
        institution: {
          select: { name: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return NextResponse.json({
      classroom: {
        id: updated.id,
        name: updated.name,
        inviteCode: updated.inviteCode,
        active: updated.active,
        createdAt: updated.createdAt.toISOString(),
        institutionName: updated.institution.name,
        studentCount: updated._count.enrollments,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar a turma." },
      { status: 500 },
    );
  }
}
