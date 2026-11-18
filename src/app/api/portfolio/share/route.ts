import { NextResponse } from "next/server";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  generateShareLink,
  revokeShareLinks,
} from "@/lib/portfolio/portfolio-service";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export async function GET() {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const activeLink = await prisma.portfolioShareLink.findFirst({
    where: {
      studentId: authResult.userId,
      active: true,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
    },
  });

  return NextResponse.json({
    hasActiveLink: Boolean(activeLink),
    createdAt: activeLink ? activeLink.createdAt.toISOString() : null,
  });
}

export async function POST() {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const result = await generateShareLink(authResult.userId);
  await recordAuditLog({
    actorId: authResult.userId,
    actorRole: authResult.role,
    action: AUDIT_ACTIONS.PORTFOLIO_SHARE_CREATED,
    targetType: "PortfolioShareLink",
  });

  return NextResponse.json(
    {
      rawToken: result.rawToken,
      createdAt: result.createdAt.toISOString(),
    },
    { status: 201 },
  );
}

export async function DELETE() {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  await revokeShareLinks(authResult.userId);
  await recordAuditLog({
    actorId: authResult.userId,
    actorRole: authResult.role,
    action: AUDIT_ACTIONS.PORTFOLIO_SHARE_REVOKED,
    targetType: "PortfolioShareLink",
  });
  return NextResponse.json({ revoked: true });
}
