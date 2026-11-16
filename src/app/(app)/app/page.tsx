import {
  ArrowRight,
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
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";
import { computeStudentStage, type StudentStage } from "@/lib/student/stage";

export const dynamic = "force-dynamic";

const STAGE_META: Record<
  StudentStage,
  {
    label: string;
    nextTitle: string;
    nextLabel: string;
    nextHref: string;
  }
> = {
  DESCOBRIR: {
    label: "Descobrir",
    nextTitle: "Mapeie seus interesses no questionário",
    nextLabel: "Fazer questionário",
    nextHref: "/app/descobrir",
  },
  APRENDER: {
    label: "Aprender",
    nextTitle: "Continue sua trilha de cursos",
    nextLabel: "Explorar trilhas",
    nextHref: "/app/aprender",
  },
  EXPERIMENTAR: {
    label: "Experimentar",
    nextTitle: "Escolha um desafio prático para resolver",
    nextLabel: "Ver desafios",
    nextHref: "/app/experimentar",
  },
  CONSTRUIR: {
    label: "Construir",
    nextTitle: "Organize seus projetos no portfólio",
    nextLabel: "Abrir portfólio",
    nextHref: "/app/portfolio",
  },
};

export default async function StudentDashboardPage() {
  const authUser = await requireRole(STUDENT_PORTAL_ROLES);

  const [
    user,
    currentStage,
    latestDiscovery,
    totalCourses,
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
    prisma.courseItem.count({
      where: { track: { published: true } },
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
      href: "/app/descobrir",
      status: latestDiscovery
        ? "Mapa de interesses pronto"
        : "Questionário pendente",
      cta: latestDiscovery ? "Ver mapa" : "Fazer questionário",
    },
    {
      key: "APRENDER" as const,
      href: "/app/aprender",
      status:
        completedCourses > 0 || inProgressCourses > 0
          ? `${completedCourses} de ${totalCourses} cursos concluídos`
          : "Nenhum curso iniciado",
      cta: "Explorar trilhas",
    },
    {
      key: "EXPERIMENTAR" as const,
      href: "/app/experimentar",
      status:
        challengeSubmissionsCount > 0
          ? `${challengeSubmissionsCount} ${
              challengeSubmissionsCount === 1
                ? "desafio enviado"
                : "desafios enviados"
            }`
          : "Nenhum desafio enviado",
      cta: "Ver desafios",
    },
    {
      key: "CONSTRUIR" as const,
      href: "/app/portfolio",
      status:
        portfolioProjectsCount > 0
          ? `${portfolioProjectsCount} ${
              portfolioProjectsCount === 1
                ? "projeto no portfólio"
                : "projetos no portfólio"
            }`
          : "Nenhum projeto próprio",
      cta: "Abrir portfólio",
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
        subtitle="Explore as 4 etapas livremente no seu ritmo."
      />

      <JourneyBar currentStage={currentStage} completedStages={completedStages} />

      <section
        aria-labelledby="recommended-next-heading"
        className="rounded-2xl bg-[var(--brand-primary)] p-6 text-white shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2.5">
            <StagePill stage={currentStage} showIcon />
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              Seu próximo passo
            </p>
            <h2
              id="recommended-next-heading"
              className="font-display text-xl font-bold text-white sm:text-2xl"
            >
              {stageInfo.nextTitle}
            </h2>
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

      <section aria-labelledby="journey-stages-heading" className="space-y-4">
        <h2
          id="journey-stages-heading"
          className="font-display text-xl font-bold text-[var(--ink-primary)]"
        >
          As 4 etapas da sua jornada
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {stages.map((stage) => {
            const isCurrent = currentStage === stage.key;
            return (
              <Card
                key={stage.key}
                as="article"
                variant={isCurrent ? "highlight" : "interactive"}
                className="flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <StagePill stage={stage.key} showIcon />
                  {isCurrent ? <Badge variant="brand">Atual</Badge> : null}
                </div>

                <p className="text-sm font-medium text-[var(--ink-primary)]">
                  {stage.status}
                </p>

                <div>
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
