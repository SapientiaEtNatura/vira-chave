import type {
  DiscoveryQuestionOption,
  SelfPracticeLevel,
} from "@/lib/discovery/types";

export interface DiscoveryScoringQuestion {
  id: string;
  weightsByArea: Record<string, number>;
}

export interface SituationalQuestion {
  id: string;
  options: DiscoveryQuestionOption[];
}

export interface AffinityScoreResult {
  scores: Record<string, number>;
  topAreas: string[];
}

function positiveWeight(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/**
 * Computes deterministic affinity scores from situational scenario choices,
 * normalized per area by the maximum available weight across each scenario.
 */
export function calculateSituationalAffinityScores(
  answers: Record<string, string>,
  questions: SituationalQuestion[],
  knownAreaSlugs?: string[],
  selfPractice?: Record<string, SelfPracticeLevel>,
): AffinityScoreResult {
  const rawTotals: Record<string, number> = {};
  const maxTotals: Record<string, number> = {};

  const ensureArea = (slug: string) => {
    if (slug.trim() && !(slug in rawTotals)) {
      rawTotals[slug] = 0;
      maxTotals[slug] = 0;
    }
  };

  if (knownAreaSlugs) {
    for (const slug of knownAreaSlugs) {
      ensureArea(slug);
    }
  }

  for (const question of questions) {
    const areaSlugs = new Set<string>();
    for (const option of question.options) {
      for (const [slug, weight] of Object.entries(option.weightsByArea)) {
        if (positiveWeight(weight) > 0 && slug.trim()) {
          areaSlugs.add(slug);
          ensureArea(slug);
        }
      }
    }

    const selectedOption = question.options.find(
      (opt) => opt.id === answers[question.id],
    );

    for (const slug of areaSlugs) {
      const maxQuestionWeight = Math.max(
        0,
        ...question.options.map((opt) =>
          positiveWeight(opt.weightsByArea[slug]),
        ),
      );
      maxTotals[slug] += maxQuestionWeight;
      rawTotals[slug] += positiveWeight(selectedOption?.weightsByArea[slug]);
    }
  }

  const scores: Record<string, number> = {};
  for (const slug of Object.keys(rawTotals)) {
    const max = maxTotals[slug] ?? 0;
    scores[slug] = max > 0 ? Math.round((rawTotals[slug] / max) * 100) : 0;
  }

  const topAreas = Object.keys(scores)
    .sort((a, b) => {
      const scoreDiff = scores[b] - scores[a];
      if (scoreDiff !== 0) return scoreDiff;
      const practiceDiff = (selfPractice?.[b] ?? 0) - (selfPractice?.[a] ?? 0);
      if (practiceDiff !== 0) return practiceDiff;
      return a.localeCompare(b);
    })
    .slice(0, 3);

  return { scores, topAreas };
}

export function calculateAffinityScores(
  answers: Record<string, number>,
  questions: DiscoveryScoringQuestion[],
): AffinityScoreResult {
  const rawTotals: Record<string, number> = {};
  const maxTotals: Record<string, number> = {};

  for (const question of questions) {
    const answer = answers[question.id];
    const hasValidAnswer =
      typeof answer === "number" && Number.isFinite(answer);

    for (const [areaSlug, weight] of Object.entries(question.weightsByArea)) {
      if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) {
        continue;
      }

      if (!(areaSlug in rawTotals)) {
        rawTotals[areaSlug] = 0;
        maxTotals[areaSlug] = 0;
      }

      if (hasValidAnswer) {
        const clampedAnswer = Math.min(5, Math.max(1, answer));
        rawTotals[areaSlug] += clampedAnswer * weight;
        maxTotals[areaSlug] += 5 * weight;
      }
    }
  }

  const scores: Record<string, number> = {};
  for (const areaSlug of Object.keys(rawTotals)) {
    const max = maxTotals[areaSlug] ?? 0;
    scores[areaSlug] =
      max > 0 ? Math.round((rawTotals[areaSlug] / max) * 100) : 0;
  }

  const topAreas = Object.keys(scores)
    .sort((a, b) => {
      const diff = scores[b] - scores[a];
      return diff !== 0 ? diff : a.localeCompare(b);
    })
    .slice(0, 3);

  return { scores, topAreas };
}
