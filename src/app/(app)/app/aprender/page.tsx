import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Progress,
  StageBanner,
} from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AprenderPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const user = await requireRole([Role.ESTUDANTE]);
  const { area } = await searchParams;
  const activeArea = area?.trim() || "";

  const [macroAreas, tracks] = await Promise.all([
    prisma.macroArea.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    }),
    prisma.track.findMany({
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
    }),
  ]);

  return (
    <div className="space-y-6">
      <StageBanner
        stage="APRENDER"
        stageLabel="Etapa 2 · Aprender"
        title="Trilhas de Aprendizagem"
        subtitle="Explore trilhas curadas com cursos gratuitos de parceiros. Ao acessar um curso, seu progresso passa para em andamento; ao terminar, registre um mini-resumo do que aprendeu."
      />

      <nav
        aria-label="Filtrar trilhas por macroárea"
        className="flex flex-wrap items-center gap-2"
      >
        <Link
          href="/app/aprender"
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
              href={`/app/aprender?area=${encodeURIComponent(macroArea.slug)}`}
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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, index) => {
            const totalCourses = track.courses.length;
            const completedCourses = track.courses.filter(
              (course) => course.progress[0]?.status === "CONCLUIDO",
            ).length;
            const inProgressCourses = track.courses.filter(
              (course) => course.progress[0]?.status === "EM_ANDAMENTO",
            ).length;
            const percent =
              totalCourses > 0
                ? Math.round((completedCourses / totalCourses) * 100)
                : 0;
            const isCompleted = totalCourses > 0 && completedCourses === totalCourses;

            const coverPalettes = [
              {
                bg: "bg-[var(--stage-discover-bg)]",
                icon: "text-[var(--stage-discover-ink)]",
              },
              {
                bg: "bg-[var(--stage-learn-bg)]",
                icon: "text-[var(--stage-learn-ink)]",
              },
              {
                bg: "bg-[var(--stage-experiment-bg)]",
                icon: "text-[var(--stage-experiment-ink)]",
              },
              {
                bg: "bg-[var(--stage-build-bg)]",
                icon: "text-[var(--stage-build-ink)]",
              },
            ];
            const palette = coverPalettes[index % coverPalettes.length];

            return (
              <Card
                key={track.id}
                as="article"
                variant="interactive"
                padding="sm"
                className="flex flex-col justify-between overflow-hidden p-0 sm:p-0"
              >
                <div>
                  <div
                    className={`relative flex h-28 items-center justify-center ${palette.bg}`}
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface)] shadow-sm ${palette.icon}`}
                    >
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {isCompleted ? (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--stage-build-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--stage-build-ink)]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Concluída
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2.5 p-5 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="neutral">{track.macroArea.name}</Badge>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-[var(--ink-muted)]">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {totalCourses} {totalCourses === 1 ? "curso" : "cursos"}
                      </span>
                    </div>

                    <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                      {track.title}
                    </h2>
                    <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {track.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-5 pb-5 pt-2">
                  <Progress
                    value={completedCourses}
                    max={totalCourses || 1}
                    tone="learn"
                    label={`Progresso em ${track.title}: ${completedCourses} de ${totalCourses} cursos concluídos`}
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-medium text-[var(--ink-muted)] tabular-nums">
                      {percent}% concluída
                    </span>

                    <Link
                      href={`/app/aprender/${track.id}`}
                      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
                    >
                      <span>
                        {isCompleted
                          ? "Revisar"
                          : completedCourses > 0 || inProgressCourses > 0
                            ? "Continuar"
                            : "Começar trilha"}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
