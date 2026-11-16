import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createPortfolioProject,
  PortfolioServiceError,
} from "@/lib/portfolio/portfolio-service";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export async function GET() {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const projects = await prisma.portfolioProject.findMany({
    where: { studentId: authResult.userId },
    orderBy: { createdAt: "desc" },
    include: {
      challenge: {
        select: { title: true },
      },
      evidenceFiles: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });

  return NextResponse.json({
    projects: projects.map((project) => ({
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
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const contentType = request.headers.get("content-type") ?? "";

  let title = "";
  let summary = "";
  let reflection = "";
  let externalUrl = "";
  let isIncludedInShare = true;
  let file: File | null = null;

  if (contentType.includes("application/json")) {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    title = typeof body.title === "string" ? body.title : "";
    summary = typeof body.summary === "string" ? body.summary : "";
    reflection = typeof body.reflection === "string" ? body.reflection : "";
    externalUrl = typeof body.externalUrl === "string" ? body.externalUrl : "";
    isIncludedInShare = body.isIncludedInShare === false ? false : true;
  } else {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Envie os dados no formato multipart/form-data ou JSON." },
        { status: 400 },
      );
    }

    const rawTitle = formData.get("title");
    title = typeof rawTitle === "string" ? rawTitle : "";

    const rawSummary = formData.get("summary");
    summary = typeof rawSummary === "string" ? rawSummary : "";

    const rawReflection = formData.get("reflection");
    reflection = typeof rawReflection === "string" ? rawReflection : "";

    const rawExternalUrl = formData.get("externalUrl");
    externalUrl = typeof rawExternalUrl === "string" ? rawExternalUrl : "";

    const rawShare = formData.get("isIncludedInShare");
    isIncludedInShare = rawShare === "false" ? false : true;

    const rawFile = formData.get("file");
    file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  }

  try {
    const project = await createPortfolioProject({
      studentId: authResult.userId,
      title,
      summary,
      reflection,
      externalUrl,
      isIncludedInShare,
      file,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível criar o projeto no portfólio." },
      { status: 500 },
    );
  }
}
