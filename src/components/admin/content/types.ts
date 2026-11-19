import type { DiscoveryQuestionOption } from "@/lib/discovery/types";

export interface AdminMacroArea {
  id: string;
  name: string;
  slug: string;
  description: string;
  entryRoles: string[];
}

export interface AdminDiscoveryQuestion {
  id: string;
  prompt: string;
  order: number;
  weightsByArea: Record<string, number>;
  options: DiscoveryQuestionOption[];
}

export interface AdminTrack {
  id: string;
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
  macroArea: { id: string; name: string; slug: string };
}

export interface AdminCourseItem {
  id: string;
  trackId: string;
  title: string;
  providerName: string;
  externalUrl: string;
  order: number;
  lastCheckedAt?: string | null;
  lastCheckOk?: boolean | null;
  lastCheckStatus?: number | null;
  track: { id: string; title: string };
}

export interface AdminChallenge {
  id: string;
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
  macroArea: { id: string; name: string; slug: string };
}

export type ContentTab =
  | "macroAreas"
  | "questions"
  | "tracks"
  | "courseItems"
  | "challenges";

export type ContentKind =
  | "macroArea"
  | "question"
  | "track"
  | "courseItem"
  | "challenge";

export interface PendingDelete {
  kind: ContentKind;
  id: string;
  label: string;
}

export type SendContentRequestFn = <T>(
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) => Promise<T | null>;

export function buildWeightsState(
  areas: AdminMacroArea[],
  existing?: Record<string, number>,
): Record<string, string> {
  const next: Record<string, string> = {};
  if (existing) {
    for (const [slug, value] of Object.entries(existing)) {
      next[slug] = String(value);
    }
  }
  for (const area of areas) {
    if (next[area.slug] === undefined) {
      next[area.slug] = "0";
    }
  }
  return next;
}
