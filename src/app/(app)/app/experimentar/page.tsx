import Link from "next/link";
import { ArrowRight, CheckCircle2, FlaskConical, Rocket, Sparkles } from "lucide-react";
import { FilterGridReveal } from "@/components/motion/FilterGridReveal";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  MacroAreaFilterBar,
  StageBanner,
} from "@/components/ui";
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

  const [macroAreas, latestDiscovery] = await Promise.all([
    prisma.macroArea.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        _count: {
          select: {
            challenges: { where: { published: true } },
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
  const recommendedSet = new Set(recommendedSlugs);
  const isRecommendedFilter = activeArea === "recomendadas";

  const challenges = await prisma.challenge.findMany({
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
    },
  });

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
          count: m._count.challenges,
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
