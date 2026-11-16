import { NextResponse } from "next/server";
import {
  ChallengeSubmissionError,
  submitChallenge,
} from "@/lib/experimentar/submit-challenge";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export async function POST(
  request: Request,
  context: { params: Promise<{ desafioId: string }> },
) {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { desafioId } = await context.params;
  if (!desafioId) {
    return NextResponse.json(
      { error: "Identificador do desafio inválido." },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie os dados no formato multipart/form-data." },
      { status: 400 },
    );
  }

  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle : "";

  const rawReflection = formData.get("reflection");
  const reflection = typeof rawReflection === "string" ? rawReflection : "";

  const rawExternalUrl = formData.get("externalUrl");
  const externalUrl = typeof rawExternalUrl === "string" ? rawExternalUrl : "";

  const rawShare = formData.get("isIncludedInShare");
  const isIncludedInShare = rawShare === "false" ? false : true;

  const rawFile = formData.get("file");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  try {
    const result = await submitChallenge({
      studentId: authResult.userId,
      challengeId: desafioId,
      title,
      reflection,
      externalUrl,
      isIncludedInShare,
      file,
    });

    return NextResponse.json(
      {
        project: {
          id: result.project.id,
          challengeId: result.project.challengeId,
          title: result.project.title,
          summary: result.project.summary,
          reflection: result.project.reflection,
          externalUrl: result.project.externalUrl,
          isIncludedInShare: result.project.isIncludedInShare,
          createdAt: result.project.createdAt.toISOString(),
        },
        evidenceFile: result.evidenceFile
          ? {
              id: result.evidenceFile.id,
              originalName: result.evidenceFile.originalName,
              mimeType: result.evidenceFile.mimeType,
              sizeBytes: result.evidenceFile.sizeBytes,
            }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ChallengeSubmissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível registrar a submissão do desafio." },
      { status: 500 },
    );
  }
}
