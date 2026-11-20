import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export const CATALOG_CACHE_TAG = "catalog";
export const CATALOG_REVALIDATE_SECONDS = 300;

function isMissingNextCacheContext(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const nextErrorCode = (error as Error & { __NEXT_ERROR_CODE?: string })
    .__NEXT_ERROR_CODE;
  if (nextErrorCode === "E469" || nextErrorCode === "E263") {
    return true;
  }
  return (
    error.message.includes("incrementalCache missing") ||
    error.message.includes("static generation store missing")
  );
}

async function runWithCatalogCache<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const cached = unstable_cache(fn, [key], {
      tags: [CATALOG_CACHE_TAG],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    });
    return await cached();
  } catch (error) {
    if (isMissingNextCacheContext(error)) {
      return fn();
    }
    throw error;
  }
}

async function fetchMacroAreas() {
  return prisma.macroArea.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      entryRoles: true,
    },
    orderBy: { name: "asc" },
  });
}

async function fetchDiscoveryQuestions() {
  return prisma.discoveryQuestion.findMany({
    orderBy: { order: "asc" },
  });
}

async function fetchPublishedCourseCount() {
  return prisma.courseItem.count({
    where: { track: { published: true } },
  });
}

/** Retorna as macroáreas públicas do catálogo em cache compartilhado (sem PII). */
export async function getCachedMacroAreas() {
  return runWithCatalogCache("catalog:macro-areas", fetchMacroAreas);
}

/** Retorna as perguntas situacionais do Descobrir em cache compartilhado (sem PII). */
export async function getCachedDiscoveryQuestions() {
  return runWithCatalogCache(
    "catalog:discovery-questions",
    fetchDiscoveryQuestions,
  );
}

/** Retorna a contagem de cursos publicados em cache compartilhado (sem PII). */
export async function getCachedPublishedCourseCount() {
  return runWithCatalogCache(
    "catalog:published-course-count",
    fetchPublishedCourseCount,
  );
}

/** Invalida a tag de cache do catálogo público após mutações administrativas. */
export function revalidateCatalogCache(): void {
  try {
    revalidateTag(CATALOG_CACHE_TAG);
  } catch (error) {
    if (isMissingNextCacheContext(error)) {
      return;
    }
    throw error;
  }
}
