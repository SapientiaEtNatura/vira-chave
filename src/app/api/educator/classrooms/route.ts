import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateClassroomInviteCode } from "@/lib/educator/classroom-analytics";
import { requireApiRole, EDUCATOR_PORTAL_ROLES } from "@/lib/rbac";

const MAX_INVITE_RETRIES = 5;

export async function GET() {
  const authResult = await requireApiRole(EDUCATOR_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const classrooms = await prisma.classroom.findMany({
    where: { educatorId: authResult.userId },
    orderBy: { createdAt: "desc" },
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
    classrooms: classrooms.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      inviteCode: classroom.inviteCode,
      active: classroom.active,
      createdAt: classroom.createdAt.toISOString(),
      institutionName: classroom.institution.name,
      studentCount: classroom._count.enrollments,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiRole(EDUCATOR_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
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
      { error: "Corpo JSON deve ser um objeto." },
      { status: 400 },
    );
  }

  const body = rawBody as Record<string, unknown>;
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (rawName.length < 2 || rawName.length > 120) {
    return NextResponse.json(
      { error: "Informe um nome de turma válido (entre 2 e 120 caracteres)." },
      { status: 400 },
    );
  }

  const educator = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: {
      institutionId: true,
      institution: {
        select: { active: true },
      },
    },
  });

  if (!educator?.institutionId || !educator.institution?.active) {
    return NextResponse.json(
      { error: "Educador sem instituição ativa vinculada." },
      { status: 400 },
    );
  }

  for (let attempt = 0; attempt < MAX_INVITE_RETRIES; attempt += 1) {
    const inviteCode = generateClassroomInviteCode();
    try {
      const classroom = await prisma.classroom.create({
        data: {
          educatorId: authResult.userId,
          institutionId: educator.institutionId,
          name: rawName,
          inviteCode,
          active: true,
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

      return NextResponse.json(
        {
          classroom: {
            id: classroom.id,
            name: classroom.name,
            inviteCode: classroom.inviteCode,
            active: classroom.active,
            createdAt: classroom.createdAt.toISOString(),
            institutionName: classroom.institution.name,
            studentCount: classroom._count.enrollments,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      return NextResponse.json(
        { error: "Não foi possível criar a turma." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Não foi possível gerar um código único para a turma. Tente novamente." },
    { status: 500 },
  );
}
