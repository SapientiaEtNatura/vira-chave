import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  generateShareLink,
  revokeShareLinks,
} from "@/lib/portfolio/portfolio-service";
import { requireApiRole } from "@/lib/rbac";

export async function GET() {
  const authResult = await requireApiRole([Role.ESTUDANTE]);
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
  const authResult = await requireApiRole([Role.ESTUDANTE]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const result = await generateShareLink(authResult.userId);
  return NextResponse.json(
    {
      rawToken: result.rawToken,
      createdAt: result.createdAt.toISOString(),
    },
    { status: 201 },
  );
}

export async function DELETE() {
  const authResult = await requireApiRole([Role.ESTUDANTE]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  await revokeShareLinks(authResult.userId);
  return NextResponse.json({ revoked: true });
}
