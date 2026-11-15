import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import {
  deletePortfolioProject,
  PortfolioServiceError,
  updatePortfolioProject,
  updatePortfolioProjectSchema,
} from "@/lib/portfolio/portfolio-service";
import { requireApiRole } from "@/lib/rbac";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole([Role.ESTUDANTE]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Identificador do projeto inválido." },
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

  const parsed = updatePortfolioProjectSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const project = await updatePortfolioProject(
      authResult.userId,
      id,
      parsed.data,
    );

    return NextResponse.json({
      project: {
        id: project.id,
        challengeId: project.challengeId,
        challengeTitle: project.challenge?.title ?? null,
        title: project.title,
        summary: project.summary,
        reflection: project.reflection,
        externalUrl: project.externalUrl,
        isIncludedInShare: project.isIncludedInShare,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        evidenceFiles: project.evidenceFiles,
      },
    });
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível atualizar o projeto." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole([Role.ESTUDANTE]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Identificador do projeto inválido." },
      { status: 400 },
    );
  }

  try {
    await deletePortfolioProject(authResult.userId, id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível excluir o projeto." },
      { status: 500 },
    );
  }
}
