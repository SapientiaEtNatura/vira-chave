import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import { FilterGridReveal } from "@/components/motion/FilterGridReveal";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
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

  const visibleMacroAreas = macroAreas.filter((m) => m._count.tracks > 0);
  const totalTracksCount = visibleMacroAreas.reduce(
    (sum, m) => sum + m._count.tracks,
    0,
  );
  const recommendedTracksCount = visibleMacroAreas
    .filter((m) => recommendedSlugs.includes(m.slug))
    .reduce((sum, m) => sum + m._count.tracks, 0);

  const chipBaseClass =
    "min-h-11 inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150";
  const chipActiveClass =
    "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-xs";
  const chipInactiveClass =
    "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]";

  return (
    <div className="space-y-6">
      <StageBanner
        stage="APRENDER"
        stageLabel="Etapa 2 · Aprender"
        title="Trilhas de Aprendizagem"
        subtitle="Cursos gratuitos curados por macroárea para você desenvolver novas habilidades."
      />

      <nav
        aria-label="Filtrar trilhas por macroárea"
        className="flex flex-wrap items-center gap-2"
      >
        <Link
          href="/app/aprender"
          scroll={false}
          aria-current={!activeArea ? "page" : undefined}
          className={`${chipBaseClass} ${!activeArea ? chipActiveClass : chipInactiveClass}`}
        >
          <span>Todas as áreas</span>
          <span className="text-xs opacity-80 tabular-nums">
            ({totalTracksCount})
          </span>
        </Link>

        {recommendedSlugs.length > 0 && recommendedTracksCount > 0 ? (
          <Link
            href="/app/aprender?area=recomendadas"
            scroll={false}
            aria-current={isRecommendedFilter ? "page" : undefined}
            className={`${chipBaseClass} ${isRecommendedFilter ? chipActiveClass : chipInactiveClass}`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Para você</span>
            <span className="text-xs opacity-80 tabular-nums">
              ({recommendedTracksCount})
            </span>
          </Link>
        ) : null}

        {visibleMacroAreas.map((macroArea) => {
          const isActive = activeArea === macroArea.slug;
          return (
            <Link
              key={macroArea.id}
              href={`/app/aprender?area=${encodeURIComponent(macroArea.slug)}`}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={`${chipBaseClass} ${isActive ? chipActiveClass : chipInactiveClass}`}
            >
              <span>{macroArea.name}</span>
              <span className="text-xs opacity-80 tabular-nums">
                ({macroArea._count.tracks})
              </span>
            </Link>
          );
        })}
      </nav>

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
