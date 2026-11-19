export type SelfPracticeLevel = 0 | 1 | 2;

export interface DiscoveryQuestionOption {
  id: string;
  label: string;
  weightsByArea: Record<string, number>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalizes untrusted JSON from `DiscoveryQuestion.optionsJson` into valid situational options.
 */
export function parseQuestionOptions(raw: unknown): DiscoveryQuestionOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const parsed: DiscoveryQuestionOption[] = [];

  for (const item of raw) {
    if (!isPlainObject(item)) continue;

    const id = typeof item.id === "string" ? item.id.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!id || !label || !isPlainObject(item.weightsByArea)) continue;

    const weightsByArea: Record<string, number> = {};
    for (const [slug, weight] of Object.entries(item.weightsByArea)) {
      const normalizedSlug = slug.trim();
      if (
        normalizedSlug &&
        typeof weight === "number" &&
        Number.isFinite(weight) &&
        weight > 0
      ) {
        weightsByArea[normalizedSlug] = weight;
      }
    }

    if (Object.keys(weightsByArea).length === 0) continue;

    parsed.push({ id, label, weightsByArea });
  }

  return parsed;
}

/**
 * Derives question-level macro-area weights as the max positive weight per area across all options.
 */
export function deriveQuestionAreaWeights(
  options: DiscoveryQuestionOption[],
): Record<string, number> {
  const derived: Record<string, number> = {};

  for (const option of options) {
    for (const [slug, weight] of Object.entries(option.weightsByArea)) {
      if (typeof weight === "number" && Number.isFinite(weight) && weight > 0) {
        derived[slug] = Math.max(derived[slug] ?? 0, weight);
      }
    }
  }

  return derived;
}

/**
 * Parses `DiscoveryResult.selfPracticeJson` safely into a 0/1/2 level map or `null`.
 */
export function parseSelfPracticeMap(
  raw: unknown,
): Record<string, SelfPracticeLevel> | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  const parsed: Record<string, SelfPracticeLevel> = {};

  for (const [slug, level] of Object.entries(raw)) {
    const normalizedSlug = slug.trim();
    if (normalizedSlug && (level === 0 || level === 1 || level === 2)) {
      parsed[normalizedSlug] = level;
    }
  }

  return Object.keys(parsed).length > 0 ? parsed : null;
}
