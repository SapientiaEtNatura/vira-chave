import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getClassroomEducationalView } from "@/lib/educator/classroom-analytics";
import { requireApiRole } from "@/lib/rbac";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole([Role.EDUCADOR]);
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

  const view = await getClassroomEducationalView(id, authResult.userId);
  if (!view) {
    return NextResponse.json(
      { error: "Turma não encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({ view });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole([Role.EDUCADOR]);
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Corpo JSON inválido." },
      { status: 400 },
    );
  }

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

  const data: { active?: boolean; name?: string } = {};

  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      return NextResponse.json(
        { error: "Informe um nome de turma válido (entre 2 e 120 caracteres)." },
        { status: 400 },
      );
    }
    data.name = trimmed;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhuma alteração válida informada." },
      { status: 400 },
    );
  }

  const updated = await prisma.classroom.update({
    where: { id: existing.id },
    data,
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
}
