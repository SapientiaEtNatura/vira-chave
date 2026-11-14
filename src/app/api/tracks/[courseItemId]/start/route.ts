import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import {
  CourseProgressError,
  startCourseProgress,
} from "@/lib/aprender/progress";
import { requireApiRole } from "@/lib/rbac";

export async function POST(
  _request: Request,
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

  try {
    const progress = await startCourseProgress({
      studentId: authResult.userId,
      courseItemId,
    });

    return NextResponse.json({
      progress: {
        id: progress.id,
        courseItemId: progress.courseItemId,
        status: progress.status,
        startedAt: progress.startedAt?.toISOString() ?? null,
        completedAt: progress.completedAt?.toISOString() ?? null,
        notes: progress.notes,
        certificateFileId: progress.certificateFileId,
      },
    });
  } catch (error) {
    if (error instanceof CourseProgressError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível registrar o acesso ao curso." },
      { status: 500 },
    );
  }
}
