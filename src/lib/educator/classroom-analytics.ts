import { randomInt } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { getCachedMacroAreas } from "@/lib/catalog-cache";
import { prisma } from "@/lib/db";
import {
  resolveStageFromMilestones,
  type StudentStage,
} from "@/lib/student/stage";

export const STAGE_ORDER: StudentStage[] = [
  "DESCOBRIR",
  "APRENDER",
  "EXPERIMENTAR",
  "CONSTRUIR",
];

export const STAGE_LABELS: Record<StudentStage, string> = {
  DESCOBRIR: "Descobrir",
  APRENDER: "Aprender",
  EXPERIMENTAR: "Experimentar",
  CONSTRUIR: "Construir",
};

export interface StageDistributionItem {
  stage: StudentStage;
  label: string;
  count: number;
}

export interface MacroAreaDistributionItem {
  slug: string;
  area: string;
  count: number;
  interestCount: number;
  practiceCount: number;
}

export interface ClassroomTopGapArea {
  slug: string;
  area: string;
  interestCount: number;
  practiceCount: number;
  gap: number;
}

export interface EducationalViewStudent {
  studentId: string;
  name: string;
  currentStage: StudentStage;
  topMacroAreas: string[];
}

export interface ClassroomEducationalView {
  classroom: {
    id: string;
    name: string;
    inviteCode: string;
    active: boolean;
    institutionName: string;
  };
  totalStudents: number;
  stageDistribution: StageDistributionItem[];
  macroAreaDistribution: MacroAreaDistributionItem[];
  topGapArea: ClassroomTopGapArea | null;
  students: EducationalViewStudent[];
}

type EducationalViewPrisma = Pick<PrismaClient, "classroom"> &
  Partial<Pick<PrismaClient, "macroArea">>;

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClassroomInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += INVITE_CODE_ALPHABET[randomInt(0, INVITE_CODE_ALPHABET.length)];
  }
  return `VC-${code}`;
}

export async function getClassroomEducationalView(
  classroomId: string,
  educatorId: string,
  prismaClient: EducationalViewPrisma = prisma,
): Promise<ClassroomEducationalView | null> {
  const [classroom, macroAreas] = await Promise.all([
    prismaClient.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        active: true,
        educatorId: true,
        institution: {
          select: { name: true },
        },
        enrollments: {
          where: {
            student: {
              status: "ACTIVE",
            },
          },
          orderBy: { enrolledAt: "asc" },
          select: {
            student: {
              select: {
                id: true,
                name: true,
                status: true,
                discoveryResults: {
                  orderBy: { completedAt: "desc" },
                  take: 1,
                  select: {
                    topAreas: true,
                  },
                },
                portfolioProjects: {
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
                },
                courseProgress: {
                  where: {
                    status: { in: ["EM_ANDAMENTO", "CONCLUIDO"] },
                  },
                  select: {
                    status: true,
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
                },
              },
            },
          },
        },
      },
    }),
    prismaClient === prisma
      ? getCachedMacroAreas()
      : prismaClient.macroArea?.findMany
        ? prismaClient.macroArea.findMany({
            select: { slug: true, name: true },
          })
        : Promise.resolve([]),
  ]);

  if (!classroom || classroom.educatorId !== educatorId) {
    return null;
  }

  const macroAreaMap = new Map<string, string>(
    macroAreas.map((area) => [area.slug, area.name]),
  );

  const stageCounts: Record<StudentStage, number> = {
    DESCOBRIR: 0,
    APRENDER: 0,
    EXPERIMENTAR: 0,
    CONSTRUIR: 0,
  };
  const interestCountsBySlug = new Map<string, number>();
  const practiceCountsBySlug = new Map<string, number>();

  const activeEnrollments = classroom.enrollments.filter(
    ({ student }) => (student.status ?? "ACTIVE") === "ACTIVE",
  );

  const students: EducationalViewStudent[] = activeEnrollments.map(
    ({ student }) => {
      const portfolioProjects = student.portfolioProjects ?? [];
      const portfolioCount = portfolioProjects.filter(
        (project) => project.challengeId === null,
      ).length;
      const challengeSubmissionCount = portfolioProjects.filter(
        (project) => project.challengeId !== null,
      ).length;
      const courseProgress = student.courseProgress ?? [];
      const activeCourseCount = courseProgress.filter(
        (progress) =>
          progress.status === "EM_ANDAMENTO" ||
          progress.status === "CONCLUIDO",
      ).length;

      const currentStage = resolveStageFromMilestones({
        portfolioCount,
        challengeSubmissionCount,
        activeCourseCount,
      });
      stageCounts[currentStage] += 1;

      const latestTopAreas = student.discoveryResults?.[0]?.topAreas ?? [];
      const topMacroAreas = latestTopAreas.map(
        (slug) => macroAreaMap.get(slug) ?? slug,
      );

      for (const slug of new Set(latestTopAreas)) {
        interestCountsBySlug.set(
          slug,
          (interestCountsBySlug.get(slug) ?? 0) + 1,
        );
      }

      const practicedSlugs = new Set<string>();
      for (const project of portfolioProjects) {
        const slug = project.challenge?.macroArea?.slug;
        if (slug) {
          practicedSlugs.add(slug);
        }
      }
      for (const progress of courseProgress) {
        if (progress.status === "CONCLUIDO") {
          const slug = progress.courseItem?.track?.macroArea?.slug;
          if (slug) {
            practicedSlugs.add(slug);
          }
        }
      }
      for (const slug of practicedSlugs) {
        practiceCountsBySlug.set(
          slug,
          (practiceCountsBySlug.get(slug) ?? 0) + 1,
        );
      }

      return {
        studentId: student.id,
        name: student.name,
        currentStage,
        topMacroAreas,
      };
    },
  );

  const stageDistribution: StageDistributionItem[] = STAGE_ORDER.map(
    (stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      count: stageCounts[stage],
    }),
  );

  const allMacroAreaSlugs = new Set<string>([
    ...interestCountsBySlug.keys(),
    ...practiceCountsBySlug.keys(),
  ]);

  const macroAreaDistribution: MacroAreaDistributionItem[] = Array.from(
    allMacroAreaSlugs,
  )
    .map((slug) => {
      const interestCount = interestCountsBySlug.get(slug) ?? 0;
      const practiceCount = practiceCountsBySlug.get(slug) ?? 0;
      return {
        slug,
        area: macroAreaMap.get(slug) ?? slug,
        count: interestCount,
        interestCount,
        practiceCount,
      };
    })
    .sort((a, b) => {
      if (b.interestCount !== a.interestCount) {
        return b.interestCount - a.interestCount;
      }
      if (b.practiceCount !== a.practiceCount) {
        return b.practiceCount - a.practiceCount;
      }
      return a.area.localeCompare(b.area);
    });

  const topGapArea: ClassroomTopGapArea | null =
    macroAreaDistribution
      .map((item) => ({
        slug: item.slug,
        area: item.area,
        interestCount: item.interestCount,
        practiceCount: item.practiceCount,
        gap: item.interestCount - item.practiceCount,
      }))
      .filter((item) => item.gap > 0)
      .sort((a, b) => {
        if (b.gap !== a.gap) {
          return b.gap - a.gap;
        }
        if (b.interestCount !== a.interestCount) {
          return b.interestCount - a.interestCount;
        }
        return a.area.localeCompare(b.area);
      })[0] ?? null;

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      inviteCode: classroom.inviteCode,
      active: classroom.active,
      institutionName: classroom.institution.name,
    },
    totalStudents: students.length,
    stageDistribution,
    macroAreaDistribution,
    topGapArea,
    students,
  };
}
