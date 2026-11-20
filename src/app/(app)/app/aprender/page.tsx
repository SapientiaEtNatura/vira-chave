import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowRight, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import { FilterGridReveal } from "@/components/motion/FilterGridReveal";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  MacroAreaFilterBar,
  Progress,
} from "@/components/ui";
import { StageBanner } from "@/components/ui/StageBanner";
import { getCachedMacroAreas } from "@/lib/catalog-cache";
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
  const isRecommendedFilter = activeArea === "recomendadas";

  const trackSelect = {
    id: true,
    title: true,
    description: true,
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
  } satisfies Prisma.TrackSelect;

  const findLatestDiscovery = () =>
    prisma.discoveryResult.findFirst({
      where: { studentId: user.userId },
      orderBy: { completedAt: "desc" },
      select: { topAreas: true },
    });

  let macroAreas: Awaited<ReturnType<typeof getCachedMacroAreas>>;
  let latestDiscovery: Awaited<ReturnType<typeof findLatestDiscovery>>;
  let tracks: Prisma.TrackGetPayload<{ select: typeof trackSelect }>[];
  let countByMacroAreaId: Map<string, number> | null = null;

  if (isRecommendedFilter) {
    const [cachedAreas, discovery, groupedCounts] = await Promise.all([
      getCachedMacroAreas(),
      findLatestDiscovery(),
      prisma.track.groupBy({
        by: ["macroAreaId"],
        where: { published: true },
        _count: { _all: true },
      }),
    ]);
    macroAreas = cachedAreas;
    latestDiscovery = discovery;
    countByMacroAreaId = new Map(
      groupedCounts.map((row) => [row.macroAreaId, row._count._all]),
    );
    const topAreas = latestDiscovery?.topAreas ?? [];
    tracks =
      topAreas.length > 0
        ? await prisma.track.findMany({
            where: {
              published: true,
              macroArea: { slug: { in: topAreas } },
            },
            orderBy: { title: "asc" },
            select: trackSelect,
          })
        : [];
  } else if (activeArea) {
    const [cachedAreas, discovery, filteredTracks, groupedCounts] =
      await Promise.all([
        getCachedMacroAreas(),
        findLatestDiscovery(),
        prisma.track.findMany({
          where: {
            published: true,
            macroArea: { slug: activeArea },
          },
          orderBy: { title: "asc" },
          select: trackSelect,
        }),
        prisma.track.groupBy({
          by: ["macroAreaId"],
          where: { published: true },
          _count: { _all: true },
        }),
      ]);
    macroAreas = cachedAreas;
    latestDiscovery = discovery;
    tracks = filteredTracks;
    countByMacroAreaId = new Map(
      groupedCounts.map((row) => [row.macroAreaId, row._count._all]),
    );
  } else {
    const [cachedAreas, discovery, allTracks] = await Promise.all([
      getCachedMacroAreas(),
      findLatestDiscovery(),
      prisma.track.findMany({
        where: { published: true },
        orderBy: { title: "asc" },
        select: trackSelect,
      }),
    ]);
    macroAreas = cachedAreas;
    latestDiscovery = discovery;
    tracks = allTracks;
  }

  const countBySlug = new Map<string, number>();
  if (!countByMacroAreaId) {
    for (const track of tracks) {
      countBySlug.set(
        track.macroArea.slug,
        (countBySlug.get(track.macroArea.slug) ?? 0) + 1,
      );
    }
  }

  const recommendedSlugs = latestDiscovery?.topAreas ?? [];
  const recommendedSet = new Set(recommendedSlugs);

  return (
    <div className="space-y-6">
      <StageBanner
        stage="APRENDER"
        stageLabel="Etapa 2 · Aprender"
        title="Trilhas de Aprendizagem"
        subtitle="Cursos curtos e gratuitos organizados por área para você desenvolver novas habilidades no seu ritmo."
      />

      <MacroAreaFilterBar
        basePath="/app/aprender"
        ariaLabel="Filtrar trilhas por área"
        activeArea={activeArea}
        recommendedSlugs={recommendedSlugs}
        items={macroAreas.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: m.name,
          count: countByMacroAreaId
            ? (countByMacroAreaId.get(m.id) ?? 0)
            : (countBySlug.get(m.slug) ?? 0),
        }))}
      />

      {tracks.length === 0 ? (
        <EmptyState
          as="h2"
          icon={<BookOpen className="h-5 w-5" />}
          title={
            activeArea
              ? "Nenhuma trilha encontrada para esta área."
              : "Nenhuma trilha publicada ainda."
          }
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
          filterKey={activeArea || "all"}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {tracks.map((track) => {
            const totalCourses = track.courses.length;
            const completedCourses = track.courses.filter(
              (course) => course.progress[0]?.status === "CONCLUIDO",
            ).length;
            const isCompleted =
              totalCourses > 0 && completedCourses === totalCourses;
            const isRecommended =
              !activeArea && recommendedSet.has(track.macroArea.slug);

            return (
              <div key={track.id} data-filter-card className="flex">
                <Card
                  as="article"
                  variant="interactive"
                  padding="sm"
                  className="flex w-full flex-col justify-between gap-4 p-5"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="learn"
                          icon={<BookOpen className="h-3.5 w-3.5" />}
                        >
                          {track.macroArea.name}
                        </Badge>
                        {isRecommended ? (
                          <Badge
                            variant="brand"
                            icon={<Sparkles className="h-3.5 w-3.5" />}
                          >
                            Para você
                          </Badge>
                        ) : null}
                      </div>
                      {isCompleted ? (
                        <Badge
                          variant="success"
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        >
                          Concluída
                        </Badge>
                      ) : (
                        <Badge variant="neutral" mono>
                          {completedCourses}/{totalCourses}{" "}
                          {totalCourses === 1 ? "curso" : "cursos"}
                        </Badge>
                      )}
                    </div>

                    <h2 className="font-display text-lg font-bold leading-snug text-[var(--ink-primary)]">
                      {track.title}
                    </h2>

                    {track.description ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                        {track.description}
                      </p>
                    ) : null}
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
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
                      >
                        <span>
                          {completedCourses > 0 && !isCompleted
                            ? "Continuar trilha"
                            : "Abrir trilha"}
                        </span>
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
