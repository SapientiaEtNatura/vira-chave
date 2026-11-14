import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowRight, CheckCircle2, Rocket, Sparkles } from "lucide-react";
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
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Rocket className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Etapa 3 · Experimentar
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Desafios Práticos
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Coloque a mão na massa resolvendo desafios reais por macroárea. Cada
          entrega gera automaticamente um projeto no seu portfólio com suas
          reflexões e evidências.
        </p>
      </header>

      <nav
        aria-label="Filtrar desafios por macroárea"
        className="flex flex-wrap items-center gap-2"
      >
        <Link
          href="/app/experimentar"
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            !activeArea
              ? "bg-indigo-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {macroArea.name}
            </Link>
          );
        })}
      </nav>

      {challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Nenhum desafio publicado encontrado para esta macroárea.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => {
            const submissionCount = challenge.projects.length;
            const isSubmitted = submissionCount > 0;

            return (
              <article
                key={challenge.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {challenge.macroArea.name}
                    </span>

                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Submetido ({submissionCount})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Disponível
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-slate-900">
                    {challenge.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {challenge.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Link
                    href={`/app/experimentar/${challenge.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <span>
                      {isSubmitted ? "Ver ou enviar nova entrega" : "Participar do desafio"}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
