import Link from "next/link";
import { ArrowRight, CheckCircle2, Rocket } from "lucide-react";
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
        subtitle="Resolva desafios reais por macroárea e transforme entregas em projetos no seu portfólio."
      />

      <MacroAreaFilterBar
        basePath="/app/experimentar"
        ariaLabel="Filtrar desafios por macroárea"
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
          icon={<Rocket className="h-5 w-5" />}
          title="Nenhum desafio publicado encontrado para esta macroárea."
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
          filterKey={activeArea ?? "all"}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {challenges.map((challenge) => {
            const submissionCount = challenge.projects.length;
            const isSubmitted = submissionCount > 0;

            return (
              <div key={challenge.id} data-filter-card className="flex">
                <Card
                  as="article"
                  variant="interactive"
                  padding="sm"
                  className="flex w-full flex-col justify-between gap-4 p-5"
                >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="neutral">{challenge.macroArea.name}</Badge>

                    {isSubmitted ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Enviado ({submissionCount})
                      </Badge>
                    ) : (
                      <Badge variant="brand">Disponível</Badge>
                    )}
                  </div>

                  <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                    {challenge.title}
                  </h2>
                </div>

                <div className="flex justify-end">
                  <Link
                    href={`/app/experimentar/${challenge.id}`}
                    className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
                  >
                    <span>Abrir desafio</span>
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
