import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { checkExternalLink } from "@/lib/link-checker";
import { requireApiRole } from "@/lib/rbac";

const BATCH_SIZE = 5;

const checkLinksSchema = z.object({
  courseId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const authResult = await requireApiRole([Role.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let rawBody: unknown = {};
  const contentLength = request.headers.get("content-length");
  if (contentLength !== "0") {
    const text = await request.text();
    if (text.trim().length > 0) {
      try {
        rawBody = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
      }
    }
  }

  const parsed = checkLinksSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { courseId } = parsed.data;

  try {
    const courses = await prisma.courseItem.findMany({
      where: courseId ? { id: courseId } : undefined,
      orderBy: [{ trackId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        externalUrl: true,
      },
    });

    if (courseId && courses.length === 0) {
      return NextResponse.json(
        { error: "Curso não encontrado." },
        { status: 404 },
      );
    }

    type CheckLinkResult = {
      id: string;
      title: string;
      externalUrl: string;
      lastCheckedAt: string;
      lastCheckOk: boolean;
      lastCheckStatus: number | null;
      reason?: string;
    };

    const results = new Array<CheckLinkResult>(courses.length);
    const pendingUpdates = new Array<{
      id: string;
      checkedAt: Date;
      ok: boolean;
      status: number | null;
    }>(courses.length);

    let nextIndex = 0;
    const workerCount = Math.min(BATCH_SIZE, courses.length);

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (true) {
          const currentIndex = nextIndex++;
          if (currentIndex >= courses.length) {
            return;
          }

          const course = courses[currentIndex];
          const check = await checkExternalLink(course.externalUrl);
          const checkedAt = new Date();

          pendingUpdates[currentIndex] = {
            id: course.id,
            checkedAt,
            ok: check.ok,
            status: check.status,
          };

          results[currentIndex] = {
            id: course.id,
            title: course.title,
            externalUrl: course.externalUrl,
            lastCheckedAt: checkedAt.toISOString(),
            lastCheckOk: check.ok,
            lastCheckStatus: check.status,
            ...(check.reason ? { reason: check.reason } : {}),
          };
        }
      }),
    );

    if (pendingUpdates.length > 0) {
      const updates = pendingUpdates.map((item) =>
        prisma.courseItem.update({
          where: { id: item.id },
          data: {
            lastCheckedAt: item.checkedAt,
            lastCheckOk: item.ok,
            lastCheckStatus: item.status,
          },
        }),
      );
      await prisma.$transaction(updates);
    }

    const okCount = results.filter((item) => item.lastCheckOk).length;
    const brokenCount = results.length - okCount;

    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.LINKS_CHECKED,
      targetType: "CourseItem",
      targetId: courseId ?? null,
      metadata: {
        totalChecked: results.length,
        okCount,
        brokenCount,
        scopedToCourseId: courseId ?? null,
      },
    });

    return NextResponse.json({
      checkedCount: results.length,
      okCount,
      brokenCount,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao verificar links dos cursos." },
      { status: 500 },
    );
  }
}
