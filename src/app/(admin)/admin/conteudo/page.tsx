import { prisma } from "@/lib/db";
import { AdminContentClient } from "@/components/admin/AdminContentClient";

export const dynamic = "force-dynamic";

function normalizeWeights(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      result[key] = raw;
    }
  }
  return result;
}

export default async function AdminContentPage() {
  const [macroAreas, questions, tracks, courseItems, challenges] =
    await Promise.all([
      prisma.macroArea.findMany({ orderBy: { name: "asc" } }),
      prisma.discoveryQuestion.findMany({ orderBy: { order: "asc" } }),
      prisma.track.findMany({
        orderBy: { title: "asc" },
        include: { macroArea: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.courseItem.findMany({
        orderBy: [{ trackId: "asc" }, { order: "asc" }],
        include: { track: { select: { id: true, title: true } } },
      }),
      prisma.challenge.findMany({
        orderBy: { title: "asc" },
        include: { macroArea: { select: { id: true, name: true, slug: true } } },
      }),
    ]);

  const serializedQuestions = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    order: q.order,
    weightsByArea: normalizeWeights(q.weightsByArea),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Curadoria de Conteúdo
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Gerencie MacroÁreas, perguntas do Descobrir, trilhas de aprendizagem, cursos
          externos e desafios práticos da plataforma.
        </p>
      </div>

      <AdminContentClient
        initialMacroAreas={macroAreas}
        initialQuestions={serializedQuestions}
        initialTracks={tracks}
        initialCourseItems={courseItems}
        initialChallenges={challenges}
      />
    </div>
  );
}
