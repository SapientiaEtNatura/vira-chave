import { isSafeAreaSlug, type SelfPracticeLevel } from "@/lib/discovery/types";

export type AreaReadinessStatus =
  | "PRONTO_PARA_EXPERIMENTAR"
  | "POTENCIAL_PARA_TRILHA";

export type PublicReadinessLabel =
  | "Prática comprovada"
  | "Em formação"
  | "Área de interesse";

export interface ProvenPracticeAreaMetrics {
  completedCourses: number;
  challengeProjects: number;
  score: number;
}

export interface ProvenPracticeSummary {
  byArea: Record<string, ProvenPracticeAreaMetrics>;
  totalCompletedCourses: number;
  totalChallengeProjects: number;
  totalProjects: number;
}

export interface DiscoveryAreaDelta {
  slug: string;
  delta: number | null;
  isNewInTop3: boolean;
}

export interface DiscoveryComparison {
  previousCompletedAt: string;
  byArea: Record<string, DiscoveryAreaDelta>;
}

/**
 * Aggregates proven practice per macro-area using the deterministic formula:
 * `min(100, completedCourses * 35 + challengeProjects * 50)`.
 */
export function calculateProvenPractice(input: {
  completedCourseAreaSlugs: string[];
  challengeProjectAreaSlugs: string[];
  totalProjects: number;
  knownAreaSlugs?: string[];
}): ProvenPracticeSummary {
  const byArea: Record<string, ProvenPracticeAreaMetrics> = {};

  const ensureArea = (slug: string): ProvenPracticeAreaMetrics | null => {
    const normalized = slug.trim();
    if (!isSafeAreaSlug(normalized)) return null;
    if (!Object.hasOwn(byArea, normalized)) {
      byArea[normalized] = {
        completedCourses: 0,
        challengeProjects: 0,
        score: 0,
      };
    }
    return byArea[normalized];
  };

  if (input.knownAreaSlugs) {
    for (const slug of input.knownAreaSlugs) {
      ensureArea(slug);
    }
  }

  let totalCompletedCourses = 0;
  for (const slug of input.completedCourseAreaSlugs) {
    const entry = ensureArea(slug);
    if (entry) {
      entry.completedCourses += 1;
      totalCompletedCourses += 1;
    }
  }

  let totalChallengeProjects = 0;
  for (const slug of input.challengeProjectAreaSlugs) {
    const entry = ensureArea(slug);
    if (entry) {
      entry.challengeProjects += 1;
      totalChallengeProjects += 1;
    }
  }

  for (const metrics of Object.values(byArea)) {
    metrics.score = Math.min(
      100,
      metrics.completedCourses * 35 + metrics.challengeProjects * 50,
    );
  }

  return {
    byArea,
    totalCompletedCourses,
    totalChallengeProjects,
    totalProjects: input.totalProjects,
  };
}

/**
 * Resolves private student readiness for an area based on proven practice and self-practice level.
 */
export function resolveAreaReadinessStatus(input: {
  provenScore: number;
  selfPracticeLevel?: SelfPracticeLevel | null;
}): AreaReadinessStatus {
  if (input.provenScore >= 50 || input.selfPracticeLevel === 2) {
    return "PRONTO_PARA_EXPERIMENTAR";
  }
  return "POTENCIAL_PARA_TRILHA";
}

/**
 * Resolves public-facing readiness badge label purely from proven practice score.
 */
export function resolvePublicReadinessStatus(
  provenScore: number,
): PublicReadinessLabel {
  if (provenScore >= 50) {
    return "Prática comprovada";
  }
  if (provenScore > 0) {
    return "Em formação";
  }
  return "Área de interesse";
}

/**
 * Computes evolution deltas between two situational discovery runs.
 * Returns `null` if there is no previous run or either run is legacy Likert.
 */
export function buildDiscoveryComparison(
  current: {
    scores: Record<string, number>;
    topAreas: string[];
    isSituational: boolean;
  },
  previous: {
    scores: Record<string, number>;
    topAreas: string[];
    completedAt: string;
    isSituational: boolean;
  } | null,
): DiscoveryComparison | null {
  if (!previous || !current.isSituational || !previous.isSituational) {
    return null;
  }

  const allSlugs = new Set<string>([
    ...Object.keys(current.scores),
    ...Object.keys(previous.scores),
  ]);

  const byArea: Record<string, DiscoveryAreaDelta> = {};
  for (const slug of allSlugs) {
    const currentScore = current.scores[slug];
    const previousScore = previous.scores[slug];
    const delta =
      typeof currentScore === "number" && typeof previousScore === "number"
        ? currentScore - previousScore
        : null;

    byArea[slug] = {
      slug,
      delta,
      isNewInTop3:
        current.topAreas.includes(slug) && !previous.topAreas.includes(slug),
    };
  }

  return {
    previousCompletedAt: previous.completedAt,
    byArea,
  };
}
