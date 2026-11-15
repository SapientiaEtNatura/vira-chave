import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import {
  TrackCoursesClient,
  type TrackCourseItemView,
} from "@/components/aprender/TrackCoursesClient";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
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
        <ButtonLink
          href="/app/aprender"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Voltar para trilhas
        </ButtonLink>
      </div>

      <Card>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{track.macroArea.name}</Badge>
          </div>
          <PageHeader
            stage="APRENDER"
            stageLabel="Etapa 2 · Aprender"
            title={track.title}
            subtitle={track.description}
          />
        </div>
      </Card>

      <TrackCoursesClient initialCourses={initialCourses} />
    </div>
  );
}
