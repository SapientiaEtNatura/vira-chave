import { Role } from "@prisma/client";
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
    userRoleGroups,
    kpiFunnelRows,
    monthlyRows,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.$queryRaw<
      Array<{
        activeInstitutions: bigint | number;
        activeClassrooms: bigint | number;
        brokenCourseLinks: bigint | number;
        descobrir: bigint | number;
        aprender: bigint | number;
        experimentar: bigint | number;
        construir: bigint | number;
      }>
    >`
      SELECT
        (SELECT COUNT(*)::bigint FROM "Institution" WHERE "active" = true) AS "activeInstitutions",
        (SELECT COUNT(*)::bigint FROM "Classroom" WHERE "active" = true) AS "activeClassrooms",
        (SELECT COUNT(*)::bigint FROM "CourseItem" WHERE "lastCheckOk" = false) AS "brokenCourseLinks",
        (
          SELECT COUNT(DISTINCT dr."studentId")::bigint
          FROM "DiscoveryResult" dr
          INNER JOIN "User" u ON u."id" = dr."studentId"
          WHERE u."role" = 'ESTUDANTE'
        ) AS "descobrir",
        (
          SELECT COUNT(DISTINCT cp."studentId")::bigint
          FROM "CourseProgress" cp
          INNER JOIN "User" u ON u."id" = cp."studentId"
          WHERE u."role" = 'ESTUDANTE'
            AND cp."status" IN ('EM_ANDAMENTO', 'CONCLUIDO')
        ) AS "aprender",
        (
          SELECT COUNT(DISTINCT pp."studentId")::bigint
          FROM "PortfolioProject" pp
          INNER JOIN "User" u ON u."id" = pp."studentId"
          WHERE u."role" = 'ESTUDANTE'
            AND pp."challengeId" IS NOT NULL
        ) AS "experimentar",
        (
          SELECT COUNT(*)::bigint
          FROM (
            SELECT pp."studentId" AS "studentId"
            FROM "PortfolioProject" pp
            INNER JOIN "User" u ON u."id" = pp."studentId"
            WHERE u."role" = 'ESTUDANTE'
            UNION
            SELECT sl."studentId" AS "studentId"
            FROM "PortfolioShareLink" sl
            INNER JOIN "User" u ON u."id" = sl."studentId"
            WHERE u."role" = 'ESTUDANTE'
              AND sl."active" = true
          ) AS construir_students
        ) AS "construir"
    `,
    prisma.$queryRaw<
      Array<{ month_key: string; role: Role; total: bigint | number }>
    >`
      SELECT
        -- "createdAt" é TIMESTAMP(3) sem timezone armazenado em UTC pelo Prisma;
        -- date_trunc direto evita conversão implícita pelo TimeZone da sessão PostgreSQL.
        to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month_key,
        role::text AS role,
        COUNT(*)::bigint AS total
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsStart}
        AND role IN ('ESTUDANTE', 'EDUCADOR')
      GROUP BY 1, 2
    `,
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

  let totalUsers = 0;
  let totalStudents = 0;
  let totalEducators = 0;
  for (const group of userRoleGroups) {
    const count = Number(group._count._all ?? 0);
    totalUsers += count;
    if (group.role === Role.ESTUDANTE) {
      totalStudents = count;
    } else if (group.role === Role.EDUCADOR) {
      totalEducators = count;
    }
  }

  const kpiFunnelRow = kpiFunnelRows[0];
  const activeInstitutions = Number(kpiFunnelRow?.activeInstitutions ?? 0);
  const activeClassrooms = Number(kpiFunnelRow?.activeClassrooms ?? 0);
  const brokenCourseLinks = Number(kpiFunnelRow?.brokenCourseLinks ?? 0);
  const descobrirCount = Number(kpiFunnelRow?.descobrir ?? 0);
  const aprenderCount = Number(kpiFunnelRow?.aprender ?? 0);
  const experimentarCount = Number(kpiFunnelRow?.experimentar ?? 0);
  const construirCount = Number(kpiFunnelRow?.construir ?? 0);

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

  for (const row of monthlyRows) {
    const bucket = bucketMap.get(row.month_key);
    if (!bucket) continue;
    const count = Number(row.total ?? 0);
    if (row.role === Role.ESTUDANTE) {
      bucket.estudantes += count;
    } else if (row.role === Role.EDUCADOR) {
      bucket.educadores += count;
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
      dbHealthy: true,
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
