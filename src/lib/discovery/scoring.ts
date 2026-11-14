export interface DiscoveryScoringQuestion {
  id: string;
  weightsByArea: Record<string, number>;
}

export interface AffinityScoreResult {
  scores: Record<string, number>;
  topAreas: string[];
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
