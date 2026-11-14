import { Role } from "@prisma/client";
import { Compass } from "lucide-react";
import { DiscoveryQuizClient } from "@/components/discovery/DiscoveryQuizClient";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function DescobrirPage() {
  const user = await requireRole([Role.ESTUDANTE]);

  const [questions, macroAreas, tracks, latestResult] = await Promise.all([
    prisma.discoveryQuestion.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        order: true,
        prompt: true,
      },
    }),
    prisma.macroArea.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    }),
    prisma.track.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      include: {
        macroArea: {
          select: {
            slug: true,
            name: true,
          },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    }),
    prisma.discoveryResult.findFirst({
      where: { studentId: user.userId },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const formattedTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    description: track.description,
    macroAreaSlug: track.macroArea.slug,
    macroAreaName: track.macroArea.name,
    courseCount: track._count.courses,
  }));

  const initialResult = latestResult
    ? {
        id: latestResult.id,
        scores:
          latestResult.scoresJson &&
          typeof latestResult.scoresJson === "object" &&
          !Array.isArray(latestResult.scoresJson)
            ? (latestResult.scoresJson as Record<string, number>)
            : {},
        topAreas: latestResult.topAreas,
        completedAt: latestResult.completedAt.toISOString(),
      }
    : null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Etapa 1 · Descobrir
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Descubra suas afinidades
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Responda ao questionário para mapear seus interesses nas 6 macroáreas do
          Vira Chave e receber recomendações de trilhas para a sua jornada.
        </p>
      </header>

      <DiscoveryQuizClient
        questions={questions}
        macroAreas={macroAreas}
        tracks={formattedTracks}
        initialResult={initialResult}
      />
    </div>
  );
}
