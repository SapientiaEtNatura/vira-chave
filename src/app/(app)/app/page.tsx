import { Role } from "@prisma/client";
import {
  ArrowRight,
  BookOpen,
  Compass,
  FolderKanban,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  ButtonLink,
  Card,
  JourneyBar,
  PageHeader,
  StagePill,
} from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { computeStudentStage, type StudentStage } from "@/lib/student/stage";

export const dynamic = "force-dynamic";

const STAGE_META: Record<
  StudentStage,
  {
    label: string;
    description: string;
    nextLabel: string;
    nextHref: string;
  }
> = {
  DESCOBRIR: {
    label: "Descobrir",
    description:
      "Comece mapeando seus interesses no questionário de afinidades ou explore qualquer etapa livremente.",
    nextLabel: "Ir para o Descobrir",
    nextHref: "/app/descobrir",
  },
  APRENDER: {
    label: "Aprender",
    description:
      "Você já iniciou sua trilha de estudos. Continue seus cursos ou experimente um desafio prático.",
    nextLabel: "Continuar no Aprender",
    nextHref: "/app/aprender",
  },
  EXPERIMENTAR: {
    label: "Experimentar",
    description:
      "Você já está colocando a mão na massa em desafios! Organize suas entregas no seu portfólio.",
    nextLabel: "Explorar desafios",
    nextHref: "/app/experimentar",
  },
  CONSTRUIR: {
    label: "Construir",
    description:
      "Você já possui projetos no seu portfólio. Continue evoluindo suas entregas e compartilhamentos.",
    nextLabel: "Abrir meu Portfólio",
    nextHref: "/app/portfolio",
  },
};

export default async function StudentDashboardPage() {
  const authUser = await requireRole([Role.ESTUDANTE]);

  const [
    user,
    currentStage,
    latestDiscovery,
    macroAreas,
    inProgressCourses,
    completedCourses,
    challengeSubmissionsCount,
    portfolioProjectsCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { name: true },
    }),
    computeStudentStage(authUser.userId),
    prisma.discoveryResult.findFirst({
      where: { studentId: authUser.userId },
      orderBy: { completedAt: "desc" },
    }),
    prisma.macroArea.findMany({
      select: { slug: true, name: true },
    }),
    prisma.courseProgress.count({
      where: { studentId: authUser.userId, status: "EM_ANDAMENTO" },
    }),
    prisma.courseProgress.count({
      where: { studentId: authUser.userId, status: "CONCLUIDO" },
    }),
    prisma.portfolioProject.count({
      where: { studentId: authUser.userId, challengeId: { not: null } },
    }),
    prisma.portfolioProject.count({
      where: { studentId: authUser.userId, challengeId: null },
    }),
  ]);

  const macroAreaMap = new Map(macroAreas.map((a) => [a.slug, a.name]));
  const topAreaNames = (latestDiscovery?.topAreas ?? [])
    .map((slug) => macroAreaMap.get(slug) ?? slug)
    .slice(0, 3);

  const stageInfo = STAGE_META[currentStage];
  const recommendedNextHref =
    !latestDiscovery && currentStage === "DESCOBRIR"
      ? "/app/descobrir"
      : stageInfo.nextHref;
  const recommendedNextLabel =
    !latestDiscovery && currentStage === "DESCOBRIR"
      ? "Começar pelo Descobrir"
      : stageInfo.nextLabel;

  const stages = [
    {
      key: "DESCOBRIR" as const,
      title: "1. Descobrir",
      href: "/app/descobrir",
      icon: Compass,
      status: latestDiscovery ? "Questionário concluído" : "Sugestão inicial",
      summary: latestDiscovery
        ? `Destaques: ${topAreaNames.join(", ")}`
        : "Responda ao questionário de afinidades para receber recomendações.",
      cta: latestDiscovery ? "Ver mapa de afinidades" : "Fazer questionário",
    },
    {
      key: "APRENDER" as const,
      title: "2. Aprender",
      href: "/app/aprender",
      icon: BookOpen,
      status:
        inProgressCourses + completedCourses > 0
          ? `${inProgressCourses} em andamento · ${completedCourses} concluídos`
          : "Nenhum curso iniciado",
      summary:
        "Trilhas e cursos gratuitos curados por macroárea para desenvolver novas habilidades.",
      cta: "Explorar trilhas",
    },
    {
      key: "EXPERIMENTAR" as const,
      title: "3. Experimentar",
      href: "/app/experimentar",
      icon: Rocket,
      status:
        challengeSubmissionsCount > 0
          ? `${challengeSubmissionsCount} ${
              challengeSubmissionsCount === 1 ? "desafio entregue" : "desafios entregues"
            }`
          : "Pronto para praticar",
      summary:
        "Desafios práticos ligados a problemas reais para testar seus conhecimentos.",
      cta: "Ver desafios",
    },
    {
      key: "CONSTRUIR" as const,
      title: "4. Construir",
      href: "/app/portfolio",
      icon: FolderKanban,
      status:
        portfolioProjectsCount > 0
          ? `${portfolioProjectsCount} ${
              portfolioProjectsCount === 1 ? "projeto próprio" : "projetos próprios"
            }`
          : "Portfólio aberto",
      summary:
        "Reúna seus projetos, reflexões e evidências em um portfólio sob seu controle.",
      cta: "Acessar portfólio",
    },
  ];

  const completedStages = [
    ...(latestDiscovery ? (["DESCOBRIR"] as const) : []),
    ...(completedCourses > 0 ? (["APRENDER"] as const) : []),
    ...(challengeSubmissionsCount > 0 ? (["EXPERIMENTAR"] as const) : []),
    ...(portfolioProjectsCount > 0 ? (["CONSTRUIR"] as const) : []),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        stage={currentStage}
        stageLabel={`Etapa atual: ${stageInfo.label}`}
        title={`Minha Jornada${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle="Você tem navegação livre para explorar qualquer etapa no seu ritmo."
      />

      {/* Trilho visual das 4 etapas */}
      <JourneyBar currentStage={currentStage} completedStages={completedStages} />

      {/* Card Próximo passo recomendado */}
      <section
        aria-labelledby="recommended-next-heading"
        className="rounded-2xl bg-gradient-to-br from-[var(--brand-primary-deep)] to-[var(--brand-primary)] p-6 text-white shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[var(--brand-primary-ink-on-dark)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Próximo passo recomendado</span>
              </span>
              <StagePill stage={currentStage} showIcon />
            </div>
            <h2
              id="recommended-next-heading"
              className="font-display text-xl font-bold text-white sm:text-2xl"
            >
              Continuar em {stageInfo.label}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--brand-primary-ink-on-dark)]">
              {stageInfo.description}
            </p>
          </div>

          <ButtonLink
            href={recommendedNextHref}
            variant="secondary"
            size="lg"
            className="shrink-0 bg-white text-[var(--brand-primary-deep)] hover:bg-[var(--bg-canvas)]"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            {recommendedNextLabel}
          </ButtonLink>
        </div>
      </section>

      {/* Grid 2x2 das 4 etapas */}
      <section aria-labelledby="journey-stages-heading" className="space-y-4">
        <div>
          <h2
            id="journey-stages-heading"
            className="font-display text-xl font-bold text-[var(--ink-primary)]"
          >
            As 4 etapas da sua jornada
          </h2>
          <p className="text-sm text-[var(--ink-muted)]">
            Explore cada etapa conforme seus objetivos de aprendizagem e prática.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isCurrent = currentStage === stage.key;
            return (
              <Card
                key={stage.key}
                as="article"
                variant={isCurrent ? "highlight" : "interactive"}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                          isCurrent
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                            : "border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
                            {stage.title}
                          </h3>
                          <StagePill stage={stage.key} showIcon />
                        </div>
                        <p className="text-xs font-medium text-[var(--brand-primary)]">
                          {stage.status}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? <Badge variant="brand">Etapa atual</Badge> : null}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--ink-secondary)]">
                    {stage.summary}
                  </p>
                </div>

                <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
                  <ButtonLink
                    href={stage.href}
                    variant={isCurrent ? "primary" : "outline"}
                    size="sm"
                    rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  >
                    {stage.cta}
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
