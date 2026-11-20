import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  calculateProvenPractice,
  type ProvenPracticeSummary,
} from "@/lib/discovery/readiness";

/**
 * Queries completed courses and portfolio projects for a student and computes proven practice.
 */
export async function getStudentProvenPractice(
  studentId: string,
  options?: { sharedOnly?: boolean; knownAreaSlugs?: string[] },
  prismaClient: Pick<
    PrismaClient,
    "courseProgress" | "portfolioProject"
  > = prisma,
): Promise<ProvenPracticeSummary> {
  const [completedCourses, portfolioProjects] = await Promise.all([
    prismaClient.courseProgress.findMany({
      where: {
        studentId,
        status: "CONCLUIDO",
      },
      select: {
        courseItem: {
          select: {
            track: {
              select: {
                macroArea: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prismaClient.portfolioProject.findMany({
      where: {
        studentId,
        ...(options?.sharedOnly === true ? { isIncludedInShare: true } : {}),
      },
      select: {
        challengeId: true,
        challenge: {
          select: {
            macroArea: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const completedCourseAreaSlugs = completedCourses
    .map((item) => item.courseItem?.track?.macroArea?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);

  const challengeProjectAreaSlugs = portfolioProjects
    .map((project) => project.challenge?.macroArea?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);

  return calculateProvenPractice({
    completedCourseAreaSlugs,
    challengeProjectAreaSlugs,
    totalProjects: portfolioProjects.length,
    knownAreaSlugs: options?.knownAreaSlugs,
  });
}
