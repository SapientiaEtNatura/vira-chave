import {
  isSafeAreaSlug,
  type DiscoveryQuestionOption,
  type SelfPracticeLevel,
} from "@/lib/discovery/types";

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

  const ensureArea = (slug: string): string | null => {
    const normalized = slug.trim();
    if (!isSafeAreaSlug(normalized)) return null;
    if (!Object.hasOwn(rawTotals, normalized)) {
      rawTotals[normalized] = 0;
      maxTotals[normalized] = 0;
    }
    return normalized;
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
        if (positiveWeight(weight) > 0) {
          const normalized = ensureArea(slug);
          if (normalized) {
            areaSlugs.add(normalized);
          }
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
          positiveWeight(
            Object.hasOwn(opt.weightsByArea, slug) ? opt.weightsByArea[slug] : 0,
          ),
        ),
      );
      maxTotals[slug] += maxQuestionWeight;
      rawTotals[slug] += positiveWeight(
        selectedOption && Object.hasOwn(selectedOption.weightsByArea, slug)
          ? selectedOption.weightsByArea[slug]
          : 0,
      );
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
      const practiceB =
        selfPractice && Object.hasOwn(selfPractice, b) ? selfPractice[b] : 0;
      const practiceA =
        selfPractice && Object.hasOwn(selfPractice, a) ? selfPractice[a] : 0;
      const practiceDiff = practiceB - practiceA;
      if (practiceDiff !== 0) return practiceDiff;
      return a.localeCompare(b);
    })
    .slice(0, 3);

  return { scores, topAreas };
}
