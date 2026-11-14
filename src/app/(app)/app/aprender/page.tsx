import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
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
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Etapa 2 · Aprender
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Trilhas de Aprendizagem
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Explore trilhas curadas com cursos gratuitos de parceiros. Ao acessar um
          curso, seu progresso passa para em andamento; ao terminar, registre um
          mini-resumo do que aprendeu.
        </p>
      </header>

      <nav
        aria-label="Filtrar trilhas por macroárea"
        className="flex flex-wrap items-center gap-2"
      >
        <Link
          href="/app/aprender"
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
              href={`/app/aprender?area=${encodeURIComponent(macroArea.slug)}`}
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

      {tracks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nenhuma trilha publicada encontrada para este filtro.
          </p>
          {activeArea && (
            <Link
              href="/app/aprender"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ver todas as trilhas
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tracks.map((track) => {
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

            return (
              <article
                key={track.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {track.macroArea.name}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {totalCourses} {totalCourses === 1 ? "curso" : "cursos"}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {track.title}
                  </h2>
                  <p className="text-sm text-slate-600">{track.description}</p>
                </div>

                <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        {completedCourses > 0 ? (
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-emerald-600"
                            aria-hidden="true"
                          />
                        ) : inProgressCourses > 0 ? (
                          <Clock
                            className="h-3.5 w-3.5 text-amber-600"
                            aria-hidden="true"
                          />
                        ) : null}
                        {completedCourses} de {totalCourses} concluídos
                      </span>
                      <span className="font-semibold text-indigo-600">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/app/aprender/${track.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <span>
                      {completedCourses > 0 || inProgressCourses > 0
                        ? "Continuar trilha"
                        : "Explorar trilha"}
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
