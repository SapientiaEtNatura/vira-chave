import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  institutionId: true,
  createdAt: true,
  updatedAt: true,
  institution: {
    select: {
      id: true,
      name: true,
      institutionCode: true,
      active: true,
    },
  },
} satisfies Prisma.UserSelect;

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

const patchUserSchema = z
  .object({
    userId: z.string().trim().min(1, "ID do usuário é obrigatório."),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
    role: z.nativeEnum(Role).optional(),
    institutionId: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.role !== undefined ||
      data.institutionId !== undefined,
    { message: "Informe ao menos um campo para atualizar." },
  );

export async function GET(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    role: searchParams.get("role") || undefined,
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parâmetros de busca inválidos." },
      { status: 400 },
    );
  }

  const { q, role, status, page, pageSize } = parsed.data;
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
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

  const parsed = patchUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { userId, status, role, institutionId } = parsed.data;

  if (userId === authResult.userId) {
    if (status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Você não pode suspender a sua própria conta." },
        { status: 400 },
      );
    }
    if (role !== undefined && role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Você não pode rebaixar o seu próprio perfil de administrador." },
        { status: 400 },
      );
    }
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, institutionId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (institutionId !== undefined && institutionId !== null) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true },
    });
    if (!institution) {
      return NextResponse.json(
        { error: "Instituição não encontrada." },
        { status: 404 },
      );
    }
  }

  const shouldRevokeSessions =
    (status !== undefined && status !== existing.status) ||
    (role !== undefined && role !== existing.role);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(institutionId !== undefined ? { institutionId } : {}),
      ...(shouldRevokeSessions ? { tokenVersion: { increment: 1 } } : {}),
    },
    select: userSelect,
  });

  const changedFields: string[] = [];
  if (status !== undefined && status !== existing.status) changedFields.push("status");
  if (role !== undefined && role !== existing.role) changedFields.push("role");
  if (institutionId !== undefined && institutionId !== existing.institutionId) {
    changedFields.push("institutionId");
  }

  await recordAuditLog({
    actorId: authResult.userId,
    actorRole: authResult.role,
    action: AUDIT_ACTIONS.USER_UPDATED,
    targetType: "User",
    targetId: updated.id,
    metadata: {
      changedFields,
      ...(status !== undefined ? { status: updated.status } : {}),
      ...(role !== undefined ? { role: updated.role } : {}),
      ...(institutionId !== undefined ? { institutionId: updated.institutionId } : {}),
    },
  });

  return NextResponse.json({
    user: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
