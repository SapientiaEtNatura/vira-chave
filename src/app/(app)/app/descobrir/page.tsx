import { DiscoveryQuizClient } from "@/components/discovery/DiscoveryQuizClient";
import { StageBanner } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function DescobrirPage() {
  const user = await requireRole(STUDENT_PORTAL_ROLES);

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
      <StageBanner
        stage="DESCOBRIR"
        stageLabel="Etapa 1 · Descobrir"
        title="Descubra suas afinidades"
        subtitle="Mapeie seus interesses nas 6 macroáreas para receber trilhas recomendadas."
      />

      <DiscoveryQuizClient
        questions={questions}
        macroAreas={macroAreas}
        tracks={formattedTracks}
        initialResult={initialResult}
      />
    </div>
  );
}
