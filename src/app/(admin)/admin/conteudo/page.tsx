import { Role } from "@prisma/client";
import { AdminContentClient } from "@/components/admin/AdminContentClient";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

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
  await requireRole([Role.ADMIN]);
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

  const serializedCourseItems = courseItems.map((item) => ({
    id: item.id,
    trackId: item.trackId,
    title: item.title,
    providerName: item.providerName,
    externalUrl: item.externalUrl,
    order: item.order,
    lastCheckedAt: item.lastCheckedAt ? item.lastCheckedAt.toISOString() : null,
    lastCheckOk: item.lastCheckOk,
    lastCheckStatus: item.lastCheckStatus,
    track: item.track,
  }));

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-3">
        <Badge variant="brand">Administração</Badge>
        <PageHeader
          title="Curadoria de Conteúdo"
          subtitle="Gerencie MacroÁreas, perguntas do Descobrir, trilhas de aprendizagem, cursos externos e desafios práticos da plataforma."
          action={
            <ButtonLink href="/admin/instituicoes" variant="outline" size="sm">
              Ir para Instituições
            </ButtonLink>
          }
        />
      </Card>

      <AdminContentClient
        initialMacroAreas={macroAreas}
        initialQuestions={serializedQuestions}
        initialTracks={tracks}
        initialCourseItems={serializedCourseItems}
        initialChallenges={challenges}
      />
    </div>
  );
}
