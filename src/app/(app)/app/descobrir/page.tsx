import { DiscoveryQuizClient } from "@/components/discovery/DiscoveryQuizClient";
import { StageBanner } from "@/components/ui/StageBanner";
import {
  getCachedDiscoveryQuestions,
  getCachedMacroAreas,
} from "@/lib/catalog-cache";
import { prisma } from "@/lib/db";
import {
  buildDiscoveryComparison,
  type ProvenPracticeSummary,
} from "@/lib/discovery/readiness";
import { getStudentProvenPractice } from "@/lib/discovery/readiness-server";
import {
  isSafeAreaSlug,
  parseQuestionOptions,
  parseSelfPracticeMap,
} from "@/lib/discovery/types";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function parseScoresJson(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const scores: Record<string, number> = {};
  for (const [slug, value] of Object.entries(raw)) {
    const normalizedSlug = slug.trim();
    if (
      isSafeAreaSlug(normalizedSlug) &&
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      scores[normalizedSlug] = value;
    }
  }
  return scores;
}

export default async function DescobrirPage() {
  const user = await requireRole(STUDENT_PORTAL_ROLES);

  const [
    questions,
    macroAreas,
    tracks,
    challenges,
    recentResults,
    rawProvenPractice,
  ] = await Promise.all([
    getCachedDiscoveryQuestions(),
    getCachedMacroAreas(),
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
    prisma.challenge.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        macroArea: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    }),
    prisma.discoveryResult.findMany({
      where: { studentId: user.userId },
      orderBy: { completedAt: "desc" },
      take: 2,
    }),
    getStudentProvenPractice(user.userId),
  ]);

  const normalizedByArea: ProvenPracticeSummary["byArea"] = {
    ...rawProvenPractice.byArea,
  };
  for (const area of macroAreas) {
    if (
      isSafeAreaSlug(area.slug) &&
      !Object.hasOwn(normalizedByArea, area.slug)
    ) {
      normalizedByArea[area.slug] = {
        completedCourses: 0,
        challengeProjects: 0,
        score: 0,
      };
    }
  }
  const provenPractice: ProvenPracticeSummary = {
    ...rawProvenPractice,
    byArea: normalizedByArea,
  };

  // LGPD Privacy by Design: never expose option weightsByArea to the browser.
  const formattedQuestions = questions.map((question) => ({
    id: question.id,
    order: question.order,
    prompt: question.prompt,
    options: parseQuestionOptions(question.optionsJson).map(
      ({ id, label }) => ({
        id,
        label,
      }),
    ),
  }));

  const formattedTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    description: track.description,
    macroAreaSlug: track.macroArea.slug,
    macroAreaName: track.macroArea.name,
    courseCount: track._count.courses,
  }));

  const formattedChallenges = challenges.map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    macroAreaSlug: challenge.macroArea.slug,
    macroAreaName: challenge.macroArea.name,
  }));

  const mapResultRow = (row: (typeof recentResults)[number]) => ({
    id: row.id,
    scores: parseScoresJson(row.scoresJson),
    topAreas: row.topAreas,
    selfPractice: parseSelfPracticeMap(row.selfPracticeJson),
    completedAt: row.completedAt.toISOString(),
  });

  const latestRow = recentResults[0] ?? null;
  const previousRow = recentResults[1] ?? null;

  const initialResult = latestRow ? mapResultRow(latestRow) : null;
  const previousResult = previousRow ? mapResultRow(previousRow) : null;

  const initialComparison =
    initialResult
      ? buildDiscoveryComparison(
          {
            scores: initialResult.scores,
            topAreas: initialResult.topAreas,
            isSituational: initialResult.selfPractice !== null,
          },
          previousResult
            ? {
                scores: previousResult.scores,
                topAreas: previousResult.topAreas,
                completedAt: previousResult.completedAt,
                isSituational: previousResult.selfPractice !== null,
              }
            : null,
        )
      : null;

  return (
    <DiscoveryQuizClient
      header={
        <StageBanner
          stage="DESCOBRIR"
          stageLabel="Etapa 1 · Descobrir"
          title="Descubra suas afinidades"
          subtitle="Responda cenários práticos e informe seu ponto de partida para gerar seu perfil de prontidão."
        />
      }
      questions={formattedQuestions}
      macroAreas={macroAreas}
      tracks={formattedTracks}
      challenges={formattedChallenges}
      provenPractice={provenPractice}
      initialResult={initialResult}
      initialComparison={initialComparison}
    />
  );
}
