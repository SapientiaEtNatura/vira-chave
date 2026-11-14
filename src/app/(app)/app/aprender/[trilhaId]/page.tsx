import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft, BookOpen } from "lucide-react";
import {
  TrackCoursesClient,
  type TrackCourseItemView,
} from "@/components/aprender/TrackCoursesClient";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function TrilhaDetailPage({
  params,
}: {
  params: Promise<{ trilhaId: string }>;
}) {
  const user = await requireRole([Role.ESTUDANTE]);
  const { trilhaId } = await params;

  const track = await prisma.track.findFirst({
    where: {
      id: trilhaId,
      published: true,
    },
    include: {
      macroArea: {
        select: {
          slug: true,
          name: true,
        },
      },
      courses: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { studentId: user.userId },
            take: 1,
          },
        },
      },
    },
  });

  if (!track) {
    notFound();
  }

  const initialCourses: TrackCourseItemView[] = track.courses.map((course) => {
    const progress = course.progress[0];
    return {
      id: course.id,
      order: course.order,
      title: course.title,
      providerName: course.providerName,
      externalUrl: course.externalUrl,
      status: progress?.status ?? "NAO_INICIADO",
      notes: progress?.notes ?? null,
      certificateFileId: progress?.certificateFileId ?? null,
      startedAt: progress?.startedAt?.toISOString() ?? null,
      completedAt: progress?.completedAt?.toISOString() ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/aprender"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar para trilhas</span>
        </Link>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {track.macroArea.name}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Etapa 2 · Aprender
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {track.title}
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              {track.description}
            </p>
          </div>
        </div>
      </header>

      <TrackCoursesClient initialCourses={initialCourses} />
    </div>
  );
}
