import { randomInt } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
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
  area: string;
  count: number;
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
  const classroom = await prismaClient.classroom.findUnique({
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
        orderBy: { enrolledAt: "asc" },
        select: {
          student: {
            select: {
              id: true,
              name: true,
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
                },
              },
              courseProgress: {
                where: {
                  status: { in: ["EM_ANDAMENTO", "CONCLUIDO"] },
                },
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!classroom || classroom.educatorId !== educatorId) {
    return null;
  }

  const macroAreaMap = new Map<string, string>();
  if (prismaClient.macroArea?.findMany) {
    const macroAreas = await prismaClient.macroArea.findMany({
      select: { slug: true, name: true },
    });
    for (const area of macroAreas) {
      macroAreaMap.set(area.slug, area.name);
    }
  }

  const stageCounts: Record<StudentStage, number> = {
    DESCOBRIR: 0,
    APRENDER: 0,
    EXPERIMENTAR: 0,
    CONSTRUIR: 0,
  };
  const macroAreaCounts = new Map<string, number>();

  const students: EducationalViewStudent[] = classroom.enrollments.map(
    ({ student }) => {
      const portfolioProjects = student.portfolioProjects ?? [];
      const portfolioCount = portfolioProjects.filter(
        (project) => project.challengeId === null,
      ).length;
      const challengeSubmissionCount = portfolioProjects.filter(
        (project) => project.challengeId !== null,
      ).length;
      const activeCourseCount = (student.courseProgress ?? []).filter(
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

      for (const area of topMacroAreas) {
        macroAreaCounts.set(area, (macroAreaCounts.get(area) ?? 0) + 1);
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

  const macroAreaDistribution: MacroAreaDistributionItem[] = Array.from(
    macroAreaCounts.entries(),
  )
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => {
      const diff = b.count - a.count;
      return diff !== 0 ? diff : a.area.localeCompare(b.area);
    });

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
    students,
  };
}
