import Link from "next/link";
import { Role } from "@prisma/client";
import {
  ArrowRight,
  BookOpen,
  Compass,
  FolderKanban,
  Rocket,
  Sparkles,
} from "lucide-react";
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

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-50">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Etapa atual: {stageInfo.label}
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Minha Jornada{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-indigo-100 sm:text-base">
              {stageInfo.description}
            </p>
          </div>

          <Link
            href={recommendedNextHref}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
          >
            <span>{recommendedNextLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="journey-stages-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="journey-stages-heading"
              className="text-xl font-bold text-slate-900"
            >
              As 4 etapas da sua jornada
            </h2>
            <p className="text-sm text-slate-600">
              Você tem navegação livre para explorar qualquer etapa no seu ritmo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isCurrent = currentStage === stage.key;
            return (
              <article
                key={stage.key}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition ${
                  isCurrent
                    ? "border-indigo-300 ring-1 ring-indigo-200"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                          isCurrent
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {stage.title}
                        </h3>
                        <p className="text-xs font-medium text-indigo-700">
                          {stage.status}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        Etapa atual
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm text-slate-600">{stage.summary}</p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Link
                    href={stage.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>{stage.cta}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
