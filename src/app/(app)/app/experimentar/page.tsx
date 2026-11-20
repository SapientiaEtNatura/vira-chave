import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowRight, CheckCircle2, FlaskConical, Rocket, Sparkles } from "lucide-react";
import { FilterGridReveal } from "@/components/motion/FilterGridReveal";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  MacroAreaFilterBar,
} from "@/components/ui";
import { StageBanner } from "@/components/ui/StageBanner";
import { getCachedMacroAreas } from "@/lib/catalog-cache";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function ExperimentarPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const user = await requireRole(STUDENT_PORTAL_ROLES);
  const { area } = await searchParams;
  const activeArea = area?.trim() || "";
  const isRecommendedFilter = activeArea === "recomendadas";

  const challengeSelect = {
    id: true,
    title: true,
    description: true,
    macroArea: {
      select: {
        slug: true,
        name: true,
      },
    },
    projects: {
      where: { studentId: user.userId },
      select: { id: true },
    },
  } satisfies Prisma.ChallengeSelect;

  const findLatestDiscovery = () =>
    prisma.discoveryResult.findFirst({
      where: { studentId: user.userId },
      orderBy: { completedAt: "desc" },
      select: { topAreas: true },
    });

  let macroAreas: Awaited<ReturnType<typeof getCachedMacroAreas>>;
  let latestDiscovery: Awaited<ReturnType<typeof findLatestDiscovery>>;
  let challenges: Prisma.ChallengeGetPayload<{ select: typeof challengeSelect }>[];
  let countByMacroAreaId: Map<string, number> | null = null;

  if (isRecommendedFilter) {
    const [cachedAreas, discovery, groupedCounts] = await Promise.all([
      getCachedMacroAreas(),
      findLatestDiscovery(),
      prisma.challenge.groupBy({
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
    challenges =
      topAreas.length > 0
        ? await prisma.challenge.findMany({
            where: {
              published: true,
              macroArea: { slug: { in: topAreas } },
            },
            orderBy: { title: "asc" },
            select: challengeSelect,
          })
        : [];
  } else if (activeArea) {
    const [cachedAreas, discovery, filteredChallenges, groupedCounts] =
      await Promise.all([
        getCachedMacroAreas(),
        findLatestDiscovery(),
        prisma.challenge.findMany({
          where: {
            published: true,
            macroArea: { slug: activeArea },
          },
          orderBy: { title: "asc" },
          select: challengeSelect,
        }),
        prisma.challenge.groupBy({
          by: ["macroAreaId"],
          where: { published: true },
          _count: { _all: true },
        }),
      ]);
    macroAreas = cachedAreas;
    latestDiscovery = discovery;
    challenges = filteredChallenges;
    countByMacroAreaId = new Map(
      groupedCounts.map((row) => [row.macroAreaId, row._count._all]),
    );
  } else {
    const [cachedAreas, discovery, allChallenges] = await Promise.all([
      getCachedMacroAreas(),
      findLatestDiscovery(),
      prisma.challenge.findMany({
        where: { published: true },
        orderBy: { title: "asc" },
        select: challengeSelect,
      }),
    ]);
    macroAreas = cachedAreas;
    latestDiscovery = discovery;
    challenges = allChallenges;
  }

  const countBySlug = new Map<string, number>();
  if (!countByMacroAreaId) {
    for (const challenge of challenges) {
      countBySlug.set(
        challenge.macroArea.slug,
        (countBySlug.get(challenge.macroArea.slug) ?? 0) + 1,
      );
    }
  }

  const recommendedSlugs = latestDiscovery?.topAreas ?? [];
  const recommendedSet = new Set(recommendedSlugs);

  return (
    <div className="space-y-6">
      <StageBanner
        stage="EXPERIMENTAR"
        stageLabel="Etapa 3 · Experimentar"
        title="Desafios Práticos"
        subtitle="Resolva desafios reais por área e salve suas entregas diretamente no seu portfólio."
      />

      <MacroAreaFilterBar
        basePath="/app/experimentar"
        ariaLabel="Filtrar desafios por área"
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

      {challenges.length === 0 ? (
        <EmptyState
          as="h2"
          icon={<Rocket className="h-5 w-5" />}
          title={
            activeArea
              ? "Nenhum desafio encontrado para esta área."
              : "Nenhum desafio publicado ainda."
          }
          action={
            activeArea ? (
              <ButtonLink href="/app/experimentar" variant="outline" size="sm">
                Ver todos os desafios
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <FilterGridReveal
          filterKey={activeArea || "all"}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {challenges.map((challenge) => {
            const submissionCount = challenge.projects.length;
            const isSubmitted = submissionCount > 0;
            const isRecommended =
              !activeArea && recommendedSet.has(challenge.macroArea.slug);

            return (
              <div key={challenge.id} data-filter-card className="flex">
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
                          variant="experiment"
                          icon={<FlaskConical className="h-3.5 w-3.5" />}
                        >
                          {challenge.macroArea.name}
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

                      {isSubmitted ? (
                        <Badge
                          variant="success"
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        >
                          Enviado ({submissionCount})
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Disponível</Badge>
                      )}
                    </div>

                    <h2 className="font-display text-lg font-bold leading-snug text-[var(--ink-primary)]">
                      {challenge.title}
                    </h2>

                    {challenge.description ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                        {challenge.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/app/experimentar/${challenge.id}`}
                      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
                    >
                      <span>
                        {isSubmitted ? "Ver entregas" : "Abrir desafio"}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
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
