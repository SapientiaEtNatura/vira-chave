import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowRight, CheckCircle2, Rocket, Sparkles } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  StageBanner,
} from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function ExperimentarPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const user = await requireRole([Role.ESTUDANTE]);
  const { area } = await searchParams;
  const activeArea = area?.trim() || "";

  const [macroAreas, challenges] = await Promise.all([
    prisma.macroArea.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    }),
    prisma.challenge.findMany({
      where: {
        published: true,
        ...(activeArea ? { macroArea: { slug: activeArea } } : {}),
      },
      orderBy: { title: "asc" },
      include: {
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
    }),
  ]);

  return (
    <div className="space-y-6">
      <StageBanner
        stage="EXPERIMENTAR"
        stageLabel="Etapa 3 · Experimentar"
        title="Desafios Práticos"
        subtitle="Coloque a mão na massa resolvendo desafios reais por macroárea. Cada entrega gera automaticamente um projeto no seu portfólio com suas reflexões e evidências."
      />

      <nav
        aria-label="Filtrar desafios por macroárea"
        className="flex flex-wrap items-center gap-2"
      >
        <Link
          href="/app/experimentar"
          className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            !activeArea
              ? "border-transparent bg-[var(--brand-primary)] text-white"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]"
          }`}
        >
          Todas as áreas
        </Link>
        {macroAreas.map((macroArea) => {
          const isActive = activeArea === macroArea.slug;
          return (
            <Link
              key={macroArea.id}
              href={`/app/experimentar?area=${encodeURIComponent(macroArea.slug)}`}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-transparent bg-[var(--brand-primary)] text-white"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]"
              }`}
            >
              {macroArea.name}
            </Link>
          );
        })}
      </nav>

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => {
            const submissionCount = challenge.projects.length;
            const isSubmitted = submissionCount > 0;

            return (
              <Card
                key={challenge.id}
                as="article"
                variant="interactive"
                padding="sm"
                className="flex flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--stage-experiment-border)] bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)]">
                      <Rocket className="h-5 w-5" aria-hidden="true" />
                    </span>

                    {isSubmitted ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Enviado ({submissionCount})
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Aberto
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4">
                    <Badge variant="neutral">{challenge.macroArea.name}</Badge>
                  </div>

                  <h2 className="mt-2.5 font-display text-lg font-bold text-[var(--ink-primary)]">
                    {challenge.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
                    {challenge.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end border-t border-[var(--border-subtle)] pt-3">
                  <Link
                    href={`/app/experimentar/${challenge.id}`}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
                  >
                    <span>
                      {isSubmitted ? "Ver entrega" : "Ver desafio"}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
