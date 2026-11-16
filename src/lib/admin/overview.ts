import { ProgressStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface AdminOverviewKpis {
  totalUsers: number;
  totalStudents: number;
  totalEducators: number;
  activeInstitutions: number;
  activeClassrooms: number;
  brokenCourseLinks: number;
  dbHealthy: boolean;
}

export interface MonthlyRegistrationBucket {
  monthLabel: string;
  estudantes: number;
  educadores: number;
}

export interface StageFunnelStep {
  stage: "Descobrir" | "Aprender" | "Experimentar" | "Construir";
  count: number;
}

export interface RecentAuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actorRole: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    role: Role;
  } | null;
}

export interface AdminOverviewData {
  kpis: AdminOverviewKpis;
  monthlyRegistrations: MonthlyRegistrationBucket[];
  stageFunnel: StageFunnelStep[];
  recentAuditLogs: RecentAuditLogItem[];
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

function formatMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(date: Date): string {
  return MONTH_FORMATTER.format(date).replace(/\.$/, "");
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Coleta KPIs agregados, série de cadastros dos últimos 6 meses e funil das 4 etapas.
 * Deve ser chamada apenas em Server Components protegidos por `requireRole([Role.ADMIN])`.
 */
export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const now = new Date();
  const sixMonthsStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1, 0, 0, 0, 0),
  );

  const [
    totalUsers,
    totalStudents,
    totalEducators,
    activeInstitutions,
    activeClassrooms,
    brokenCourseLinks,
    dbHealthy,
    recentUsers,
    descobrirCount,
    aprenderCount,
    experimentarCount,
    construirCount,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.ESTUDANTE } }),
    prisma.user.count({ where: { role: Role.EDUCADOR } }),
    prisma.institution.count({ where: { active: true } }),
    prisma.classroom.count({ where: { active: true } }),
    prisma.courseItem.count({ where: { lastCheckOk: false } }),
    checkDatabaseHealth(),
    prisma.user.findMany({
      where: {
        createdAt: { gte: sixMonthsStart },
        role: { in: [Role.ESTUDANTE, Role.EDUCADOR] },
      },
      select: {
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.ESTUDANTE,
        discoveryResults: { some: {} },
      },
    }),
    prisma.user.count({
      where: {
        role: Role.ESTUDANTE,
        courseProgress: {
          some: {
            status: { in: [ProgressStatus.EM_ANDAMENTO, ProgressStatus.CONCLUIDO] },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: Role.ESTUDANTE,
        portfolioProjects: { some: { challengeId: { not: null } } },
      },
    }),
    prisma.user.count({
      where: {
        role: Role.ESTUDANTE,
        OR: [
          { portfolioProjects: { some: {} } },
          { shareLinks: { some: { active: true } } },
        ],
      },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        actorRole: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const bucketMap = new Map<string, MonthlyRegistrationBucket>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const bucketDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1, 0, 0, 0, 0),
    );
    const key = formatMonthKey(bucketDate);
    bucketMap.set(key, {
      monthLabel: formatMonthLabel(bucketDate),
      estudantes: 0,
      educadores: 0,
    });
  }

  for (const user of recentUsers) {
    const key = formatMonthKey(user.createdAt);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    if (user.role === Role.ESTUDANTE) {
      bucket.estudantes += 1;
    } else if (user.role === Role.EDUCADOR) {
      bucket.educadores += 1;
    }
  }

  return {
    kpis: {
      totalUsers,
      totalStudents,
      totalEducators,
      activeInstitutions,
      activeClassrooms,
      brokenCourseLinks,
      dbHealthy,
    },
    monthlyRegistrations: Array.from(bucketMap.values()),
    stageFunnel: [
      { stage: "Descobrir", count: descobrirCount },
      { stage: "Aprender", count: aprenderCount },
      { stage: "Experimentar", count: experimentarCount },
      { stage: "Construir", count: construirCount },
    ],
    recentAuditLogs,
  };
}
