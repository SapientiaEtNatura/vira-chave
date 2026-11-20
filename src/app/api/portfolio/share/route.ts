import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  generateShareLink,
  revokeShareLinks,
  updateShareLinkPreferences,
} from "@/lib/portfolio/portfolio-service";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

const createShareLinkSchema = z.object({
  includeReadiness: z
    .boolean({ message: "Preferência de prontidão inválida." })
    .optional(),
});

const updateSharePreferencesSchema = z.object({
  includeReadiness: z.boolean({
    message: "Preferência de prontidão inválida.",
  }),
});

export async function GET() {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const activeLink = await prisma.portfolioShareLink.findFirst({
      where: {
        studentId: authResult.userId,
        active: true,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        includeReadiness: true,
      },
    });

    return NextResponse.json({
      hasActiveLink: Boolean(activeLink),
      createdAt: activeLink ? activeLink.createdAt.toISOString() : null,
      includeReadiness: activeLink ? activeLink.includeReadiness : false,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao carregar link de compartilhamento." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let includeReadiness = false;
  const rawBody = await request.text();
  if (rawBody.trim().length > 0) {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Payload JSON inválido." },
        { status: 400 },
      );
    }

    const parsed = createShareLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }
    includeReadiness = parsed.data.includeReadiness ?? false;
  }

  try {
    const result = await generateShareLink(authResult.userId, prisma, {
      includeReadiness,
    });
    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.PORTFOLIO_SHARE_CREATED,
      targetType: "PortfolioShareLink",
      metadata: { includeReadiness: result.includeReadiness },
    });

    return NextResponse.json(
      {
        rawToken: result.rawToken,
        createdAt: result.createdAt.toISOString(),
        includeReadiness: result.includeReadiness,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao gerar link de compartilhamento." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = updateSharePreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const result = await updateShareLinkPreferences(
      authResult.userId,
      parsed.data.includeReadiness,
    );

    if (!result.updated) {
      return NextResponse.json(
        { error: "Nenhum link de compartilhamento ativo encontrado." },
        { status: 404 },
      );
    }

    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.PORTFOLIO_SHARE_UPDATED,
      targetType: "PortfolioShareLink",
      metadata: { includeReadiness: result.includeReadiness },
    });

    return NextResponse.json({
      includeReadiness: result.includeReadiness,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao atualizar preferências do link." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    await revokeShareLinks(authResult.userId);
    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.PORTFOLIO_SHARE_REVOKED,
      targetType: "PortfolioShareLink",
    });
    return NextResponse.json({ revoked: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao revogar link de compartilhamento." },
      { status: 500 },
    );
  }
}
