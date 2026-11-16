import { NextResponse } from "next/server";
import {
  deletePortfolioProject,
  PortfolioServiceError,
  updatePortfolioProject,
} from "@/lib/portfolio/portfolio-service";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Corpo JSON inválido." },
      { status: 400 },
    );
  }

  try {
    const project = await updatePortfolioProject(authResult.userId, id, {
      title: typeof body.title === "string" ? body.title : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      reflection:
        typeof body.reflection === "string" ? body.reflection : undefined,
      externalUrl:
        body.externalUrl === null || typeof body.externalUrl === "string"
          ? body.externalUrl
          : undefined,
      isIncludedInShare:
        typeof body.isIncludedInShare === "boolean"
          ? body.isIncludedInShare
          : undefined,
    });

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
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
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
