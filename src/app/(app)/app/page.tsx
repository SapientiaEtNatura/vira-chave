import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FlaskConical,
  FolderKanban,
  Link2,
} from "lucide-react";
import {
  Badge,
  ButtonLink,
  Card,
  JourneyBar,
  PageHeader,
  StagePill,
} from "@/components/ui";
import {
  getCachedMacroAreas,
  getCachedPublishedCourseCount,
} from "@/lib/catalog-cache";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";
import {
  resolveStageFromMilestones,
  type StudentStage,
} from "@/lib/student/stage";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<StudentStage, string> = {
  DESCOBRIR: "Descobrir",
  APRENDER: "Aprender",
  EXPERIMENTAR: "Experimentar",
  CONSTRUIR: "Construir",
};

function parseTopAreas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

export default async function StudentDashboardPage() {
  const authUser = await requireRole(STUDENT_PORTAL_ROLES);

  const [
    latestDiscovery,
    macroAreas,
    totalCourses,
    courseProgressGroups,
    latestInProgressCourse,
    portfolioProjects,
    activeShareLink,
  ] = await Promise.all([
    prisma.discoveryResult.findFirst({
      where: { studentId: authUser.userId },
      orderBy: { completedAt: "desc" },
      select: { id: true, topAreas: true },
    }),
    getCachedMacroAreas(),
    getCachedPublishedCourseCount(),
    prisma.courseProgress.groupBy({
      by: ["status"],
      where: {
        studentId: authUser.userId,
        status: { in: ["EM_ANDAMENTO", "CONCLUIDO"] },
      },
      _count: { _all: true },
    }),
    prisma.courseProgress.findFirst({
      where: { studentId: authUser.userId, status: "EM_ANDAMENTO" },
      orderBy: { startedAt: "desc" },
      select: {
        courseItem: {
          select: {
            title: true,
            track: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.portfolioProject.findMany({
      where: { studentId: authUser.userId },
      select: { challengeId: true },
    }),
    prisma.portfolioShareLink.findFirst({
      where: { studentId: authUser.userId, active: true, revokedAt: null },
      select: { id: true },
    }),
  ]);

  let inProgressCourses = 0;
  let completedCourses = 0;
  for (const group of courseProgressGroups) {
    if (group.status === "EM_ANDAMENTO") {
      inProgressCourses = group._count._all;
    } else if (group.status === "CONCLUIDO") {
      completedCourses = group._count._all;
    }
  }

  let challengeSubmissionsCount = 0;
  let standalonePortfolioCount = 0;
  for (const project of portfolioProjects) {
    if (project.challengeId !== null) {
      challengeSubmissionsCount += 1;
    } else {
      standalonePortfolioCount += 1;
    }
  }

  const totalPortfolioProjectsCount =
    standalonePortfolioCount + challengeSubmissionsCount;
  const hasDiscovery = Boolean(latestDiscovery);
  const hasActiveShareLink = Boolean(activeShareLink);

  const currentStage = resolveStageFromMilestones({
    portfolioCount: standalonePortfolioCount,
    challengeSubmissionCount: challengeSubmissionsCount,
    activeCourseCount: inProgressCourses + completedCourses,
    hasDiscovery,
    hasActiveShareLink,
  });

  const areaNameBySlug = new Map(macroAreas.map((a) => [a.slug, a.name]));
  const topAreaItems = parseTopAreas(latestDiscovery?.topAreas)
    .slice(0, 3)
    .map((slug) => ({
      slug,
      name: areaNameBySlug.get(slug) ?? slug,
    }));

  const primaryTopArea = topAreaItems[0];

  let nextTitle = "Mapeie suas áreas de interesse em cenários práticos";
  let nextDescription =
    "Leva poucos minutos e libera recomendações sob medida para suas trilhas e desafios.";
  let nextLabel = "Começar pelo Descobrir";
  let nextHref = "/app/descobrir";
  let nextStage: StudentStage = "DESCOBRIR";

  if (!hasDiscovery) {
    nextStage = "DESCOBRIR";
  } else if (latestInProgressCourse) {
    nextStage = "APRENDER";
    nextTitle = `Retome "${latestInProgressCourse.courseItem.title}"`;
    nextDescription = `Da trilha ${latestInProgressCourse.courseItem.track.title}. Concluir o curso soma na sua prática comprovada.`;
    nextLabel = "Continuar trilha";
    nextHref = `/app/aprender/${latestInProgressCourse.courseItem.track.id}`;
  } else if (completedCourses === 0) {
    nextStage = "APRENDER";
    nextTitle = primaryTopArea
      ? `Comece uma trilha em ${primaryTopArea.name}`
      : "Escolha sua primeira trilha gratuita";
    nextDescription =
      "Seu mapa de afinidades já está pronto. Agora vale testar o tema em um curso curto.";
    nextLabel = "Explorar trilhas";
    nextHref = primaryTopArea
      ? `/app/aprender?area=${primaryTopArea.slug}`
      : "/app/aprender";
  } else if (challengeSubmissionsCount === 0) {
    nextStage = "EXPERIMENTAR";
    nextTitle = primaryTopArea
      ? `Resolva um desafio prático de ${primaryTopArea.name}`
      : "Escolha um desafio prático para resolver";
    nextDescription =
      "Sua entrega fica salva automaticamente no portfólio como evidência real do que você praticou.";
    nextLabel = "Ver desafios";
    nextHref = primaryTopArea
      ? `/app/experimentar?area=${primaryTopArea.slug}`
      : "/app/experimentar";
  } else if (!hasActiveShareLink) {
    nextStage = "CONSTRUIR";
    nextTitle = "Revise seu portfólio e ative seu link compartilhável";
    nextDescription = `Você já reuniu ${totalPortfolioProjectsCount} ${
      totalPortfolioProjectsCount === 1 ? "projeto" : "projetos"
    }. Escolha o que exibir e compartilhe quando quiser.`;
    nextLabel = "Organizar portfólio";
    nextHref = "/app/portfolio";
  } else {
    nextStage = "CONSTRUIR";
    nextTitle = "Continue fortalecendo seu portfólio com novas entregas";
    nextDescription =
      "Seu link compartilhável está ativo. Cada novo desafio ou projeto autoral amplia suas evidências.";
    nextLabel = "Abrir portfólio";
    nextHref = "/app/portfolio";
  }

  const completedStages = [
    ...(hasDiscovery ? (["DESCOBRIR"] as const) : []),
    ...(completedCourses > 0 ? (["APRENDER"] as const) : []),
    ...(challengeSubmissionsCount > 0 ? (["EXPERIMENTAR"] as const) : []),
    ...(totalPortfolioProjectsCount > 0 && hasActiveShareLink
      ? (["CONSTRUIR"] as const)
      : []),
  ];

  const firstName = authUser.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        stage={currentStage}
        stageLabel={`Etapa atual: ${STAGE_LABEL[currentStage]}`}
        title={firstName ? `Olá, ${firstName}` : "Seu percurso"}
        subtitle="Acompanhe onde você parou e avance livremente pelas quatro etapas."
      />

      <JourneyBar currentStage={nextStage} completedStages={completedStages} />

      <section
        aria-labelledby="recommended-next-heading"
        className="rounded-2xl bg-[var(--brand-primary-deep)] p-6 text-white sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[58ch] space-y-2.5">
            <StagePill stage={nextStage} showIcon size="md" />
            <h2
              id="recommended-next-heading"
              className="font-display text-xl font-bold leading-snug text-white sm:text-2xl"
            >
              {nextTitle}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--brand-primary-ink-on-dark)]">
              {nextDescription}
            </p>
          </div>

          <ButtonLink
            href={nextHref}
            variant="secondary"
            size="lg"
            className="shrink-0 bg-white text-[var(--brand-primary-deep)] hover:bg-[var(--bg-canvas)]"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            {nextLabel}
          </ButtonLink>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card
          as="section"
          aria-labelledby="student-areas-heading"
          padding="md"
          className="flex flex-col justify-between gap-5 lg:col-span-6"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass
                  className="h-4 w-4 text-[var(--stage-discover-ink)]"
                  aria-hidden="true"
                />
                <h2
                  id="student-areas-heading"
                  className="font-display text-lg font-bold text-[var(--ink-primary)]"
                >
                  Suas áreas em destaque
                </h2>
              </div>
              {hasDiscovery ? (
                <Badge
                  variant="success"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Mapa pronto
                </Badge>
              ) : (
                <Badge variant="neutral" dot>
                  Pendente
                </Badge>
              )}
            </div>

            {topAreaItems.length > 0 ? (
              <ul className="space-y-2">
                {topAreaItems.map((area, index) => (
                  <li key={area.slug}>
                    <Link
                      href={`/app/aprender?area=${area.slug}`}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-soft)]/50"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Badge variant="discover" mono>
                          #{index + 1}
                        </Badge>
                        <span className="truncate font-semibold text-[var(--ink-primary)]">
                          {area.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[var(--brand-primary)]">
                        Ver trilhas
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                Complete os cenários práticos do Descobrir para ver suas
                principais áreas de afinidade aqui e personalizar trilhas e
                desafios.
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-3">
            <Link
              href="/app/descobrir"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <span>
                {hasDiscovery
                  ? "Abrir mapa completo de afinidades"
                  : "Fazer mapeamento de afinidades"}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card
          as="section"
          aria-labelledby="student-progress-heading"
          padding="md"
          className="flex flex-col justify-between gap-5 lg:col-span-6"
        >
          <div className="space-y-3">
            <h2
              id="student-progress-heading"
              className="font-display text-lg font-bold text-[var(--ink-primary)]"
            >
              Resumo das suas entregas
            </h2>

            <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
              <Link
                href="/app/aprender"
                className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-surface)]"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                  <BookOpen
                    className="h-4 w-4 shrink-0 text-[var(--stage-learn-ink)]"
                    aria-hidden="true"
                  />
                  <span>Cursos nas trilhas</span>
                </span>
                <Badge
                  variant={
                    completedCourses > 0
                      ? "success"
                      : inProgressCourses > 0
                        ? "learn"
                        : "neutral"
                  }
                  mono
                >
                  {completedCourses > 0
                    ? `${completedCourses} concluído${completedCourses === 1 ? "" : "s"}`
                    : inProgressCourses > 0
                      ? `${inProgressCourses} em andamento`
                      : `${totalCourses} disponíveis`}
                </Badge>
              </Link>

              <Link
                href="/app/experimentar"
                className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-surface)]"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                  <FlaskConical
                    className="h-4 w-4 shrink-0 text-[var(--stage-experiment-ink)]"
                    aria-hidden="true"
                  />
                  <span>Desafios práticos</span>
                </span>
                <Badge
                  variant={challengeSubmissionsCount > 0 ? "success" : "neutral"}
                  mono={challengeSubmissionsCount > 0}
                >
                  {challengeSubmissionsCount > 0
                    ? `${challengeSubmissionsCount} ${
                        challengeSubmissionsCount === 1
                          ? "entrega enviada"
                          : "entregas enviadas"
                      }`
                    : "Nenhum enviado"}
                </Badge>
              </Link>

              <Link
                href="/app/portfolio"
                className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-surface)]"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                  <FolderKanban
                    className="h-4 w-4 shrink-0 text-[var(--stage-build-ink)]"
                    aria-hidden="true"
                  />
                  <span>Projetos no portfólio</span>
                </span>
                <Badge
                  variant={totalPortfolioProjectsCount > 0 ? "success" : "neutral"}
                  mono={totalPortfolioProjectsCount > 0}
                >
                  {totalPortfolioProjectsCount > 0
                    ? `${totalPortfolioProjectsCount} ${
                        totalPortfolioProjectsCount === 1
                          ? "projeto"
                          : "projetos"
                      }`
                    : "Ainda vazio"}
                </Badge>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)]">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              {hasActiveShareLink
                ? "Link compartilhável ativo"
                : "Portfólio privado por padrão"}
            </span>
            <Link
              href="/app/portfolio"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <span>Gerenciar portfólio</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
