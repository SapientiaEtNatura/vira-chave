import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const querySchema = z.object({
  action: z.string().trim().max(80).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export async function GET(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    action: searchParams.get("action") || undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parâmetros de busca inválidos." },
      { status: 400 },
    );
  }

  const { action, q, page, pageSize } = parsed.data;
  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { targetType: { contains: q, mode: "insensitive" } },
            { targetId: { contains: q, mode: "insensitive" } },
            { actor: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  try {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao carregar logs de auditoria." },
      { status: 500 },
    );
  }
}
