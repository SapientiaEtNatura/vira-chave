import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import {
  completeCourseProgress,
  CourseProgressError,
} from "@/lib/aprender/progress";
import { requireApiRole } from "@/lib/rbac";

export async function POST(
  request: Request,
  context: { params: Promise<{ courseItemId: string }> },
) {
  const authResult = await requireApiRole([Role.ESTUDANTE]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { courseItemId } = await context.params;
  if (!courseItemId) {
    return NextResponse.json(
      { error: "Identificador do curso inválido." },
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

  const rawNotes = formData.get("notes");
  const notes = typeof rawNotes === "string" ? rawNotes : "";
  const rawFile = formData.get("file");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  const addToPortfolio = formData.get("addToPortfolio") === "true";

  try {
    const progress = await completeCourseProgress({
      studentId: authResult.userId,
      courseItemId,
      notes,
      file,
      addToPortfolio,
    });

    return NextResponse.json({
      progress: {
        id: progress.id,
        courseItemId: progress.courseItemId,
        status: progress.status,
        notes: progress.notes,
        certificateFileId: progress.certificateFileId,
        startedAt: progress.startedAt?.toISOString() ?? null,
        completedAt: progress.completedAt?.toISOString() ?? null,
      },
      certificateFileId: progress.certificateFileId,
    });
  } catch (error) {
    if (error instanceof CourseProgressError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível concluir o curso." },
      { status: 500 },
    );
  }
}
