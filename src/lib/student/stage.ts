import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export type StudentStage =
  | "CONSTRUIR"
  | "EXPERIMENTAR"
  | "APRENDER"
  | "DESCOBRIR";

export interface StudentMilestoneCounts {
  portfolioCount: number;
  challengeSubmissionCount: number;
  activeCourseCount: number;
}

export function resolveStageFromMilestones(
  counts: StudentMilestoneCounts,
): StudentStage {
  if (counts.portfolioCount > 0) {
    return "CONSTRUIR";
  }
  if (counts.challengeSubmissionCount > 0) {
    return "EXPERIMENTAR";
  }
  if (counts.activeCourseCount > 0) {
    return "APRENDER";
  }
  return "DESCOBRIR";
}

export async function computeStudentStage(
  studentId: string,
  prismaClient: Pick<
    PrismaClient,
    "portfolioProject" | "courseProgress"
  > = prisma,
): Promise<StudentStage> {
  const [portfolioCount, challengeSubmissionCount, activeCourseCount] =
    await Promise.all([
      prismaClient.portfolioProject.count({
        where: { studentId, challengeId: null },
      }),
      prismaClient.portfolioProject.count({
        where: { studentId, challengeId: { not: null } },
      }),
      prismaClient.courseProgress.count({
        where: {
          studentId,
          status: { in: ["EM_ANDAMENTO", "CONCLUIDO"] },
        },
      }),
    ]);

  return resolveStageFromMilestones({
    portfolioCount,
    challengeSubmissionCount,
    activeCourseCount,
  });
}
