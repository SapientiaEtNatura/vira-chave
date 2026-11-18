import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { FilterGridReveal } from "@/components/motion/FilterGridReveal";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  MacroAreaFilterBar,
  Progress,
  StageBanner,
} from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AprenderPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const user = await requireRole(STUDENT_PORTAL_ROLES);
  const { area } = await searchParams;
  const activeArea = area?.trim() || "";

  const [macroAreas, latestDiscovery] = await Promise.all([
    prisma.macroArea.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        _count: {
          select: {
            tracks: { where: { published: true } },
          },
        },
      },
    }),
    prisma.discoveryResult.findFirst({
      where: { studentId: user.userId },
      orderBy: { completedAt: "desc" },
      select: { topAreas: true },
    }),
  ]);

  const recommendedSlugs = latestDiscovery?.topAreas ?? [];
  const isRecommendedFilter = activeArea === "recomendadas";

  const tracks = await prisma.track.findMany({
    where: {
      published: true,
      ...(isRecommendedFilter
        ? { macroArea: { slug: { in: recommendedSlugs } } }
        : activeArea
          ? { macroArea: { slug: activeArea } }
          : {}),
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      macroArea: {
        select: {
          slug: true,
          name: true,
        },
      },
      courses: {
        select: {
          id: true,
          progress: {
            where: { studentId: user.userId },
            select: { status: true },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <StageBanner
        stage="APRENDER"
        stageLabel="Etapa 2 · Aprender"
        title="Trilhas de Aprendizagem"
        subtitle="Cursos gratuitos curados por macroárea para você desenvolver novas habilidades."
      />

      <MacroAreaFilterBar
        basePath="/app/aprender"
        ariaLabel="Filtrar trilhas por macroárea"
        activeArea={activeArea}
        recommendedSlugs={recommendedSlugs}
        items={macroAreas.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: m.name,
          count: m._count.tracks,
        }))}
      />

      {tracks.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="Nenhuma trilha publicada encontrada para este filtro."
          action={
            activeArea ? (
              <ButtonLink href="/app/aprender" variant="outline" size="sm">
                Ver todas as trilhas
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <FilterGridReveal
          filterKey={activeArea ?? "all"}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {tracks.map((track) => {
            const totalCourses = track.courses.length;
            const completedCourses = track.courses.filter(
              (course) => course.progress[0]?.status === "CONCLUIDO",
            ).length;
            const isCompleted =
              totalCourses > 0 && completedCourses === totalCourses;

            return (
              <div key={track.id} data-filter-card className="flex">
                <Card
                  as="article"
                  variant="interactive"
                  padding="sm"
                  className="flex w-full flex-col justify-between gap-4 p-5"
                >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="neutral">{track.macroArea.name}</Badge>
                    {isCompleted ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Concluída
                      </Badge>
                    ) : (
                      <span className="font-mono text-xs font-medium text-[var(--ink-muted)] tabular-nums">
                        {completedCourses}/{totalCourses}{" "}
                        {totalCourses === 1 ? "curso" : "cursos"}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                    {track.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  <Progress
                    value={completedCourses}
                    max={totalCourses || 1}
                    tone="learn"
                    label={`Progresso em ${track.title}: ${completedCourses} de ${totalCourses} cursos concluídos`}
                  />

                  <div className="flex justify-end">
                    <Link
                      href={`/app/aprender/${track.id}`}
                      className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
                    >
                      <span>Abrir trilha</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>
              </div>
            );
          })}
        </FilterGridReveal>
      )}
    </div>
  );
}
