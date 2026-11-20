import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  requireApiRole: vi.fn(),
  getCachedMacroAreas: vi.fn(),
  getCachedDiscoveryQuestions: vi.fn(),
  getCachedPublishedCourseCount: vi.fn(),
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    institution: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    classroom: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    courseItem: {
      count: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    discoveryResult: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    discoveryQuestion: {
      findMany: vi.fn(),
    },
    macroArea: {
      findMany: vi.fn(),
    },
    courseProgress: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    portfolioProject: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    portfolioShareLink: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    track: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    challenge: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: mocks.requireRole,
  requireApiRole: mocks.requireApiRole,
  STUDENT_PORTAL_ROLES: ["ESTUDANTE", "ADMIN"],
  EDUCATOR_PORTAL_ROLES: ["EDUCADOR", "ADMIN"],
}));

vi.mock("@/lib/catalog-cache", () => ({
  CATALOG_CACHE_TAG: "catalog",
  CATALOG_REVALIDATE_SECONDS: 300,
  getCachedMacroAreas: mocks.getCachedMacroAreas,
  getCachedDiscoveryQuestions: mocks.getCachedDiscoveryQuestions,
  getCachedPublishedCourseCount: mocks.getCachedPublishedCourseCount,
  revalidateCatalogCache: vi.fn(),
}));

import { getAdminOverviewData } from "@/lib/admin/overview";
import { getClassroomEducationalView } from "@/lib/educator/classroom-analytics";
import { getSharedPortfolioByToken } from "@/lib/portfolio/portfolio-service";
import { hashShareToken } from "@/lib/portfolio/share-token";
import StudentDashboardPage from "@/app/(app)/app/page";
import DescobrirPage from "@/app/(app)/app/descobrir/page";
import AprenderPage from "@/app/(app)/app/aprender/page";
import ExperimentarPage from "@/app/(app)/app/experimentar/page";
import AdminInstitutionsPage from "@/app/(admin)/admin/instituicoes/page";
import { GET as getAdminInstitutions } from "@/app/api/admin/institutions/route";
import { GET as getAdminClassrooms } from "@/app/api/admin/classrooms/route";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve();
  }
}

const SAMPLE_MACRO_AREAS = [
  {
    id: "ma-1",
    name: "Design e Criação Digital",
    slug: "design-criacao",
    description: "Criação visual e interfaces.",
    entryRoles: ["Assistente de Criação Digital"],
  },
  {
    id: "ma-2",
    name: "Tecnologia e Dados",
    slug: "tecnologia-dados",
    description: "Análise de dados e software.",
    entryRoles: ["Jovem Aprendiz em Suporte de TI"],
  },
];

describe("Task 6 — Query Consolidation & Waterfall Elimination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("PERF-02: getAdminOverviewData consolida queries (<= 5 chamadas ao DB), não chama user.findMany e preserva formato exato", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T12:00:00.000Z"));

    let dbCallCount = 0;

    const auditLogs = [
      {
        id: "audit-1",
        action: "INSTITUTION_CREATED",
        targetType: "Institution",
        targetId: "inst-1",
        actorRole: "ADMIN",
        createdAt: new Date("2026-11-19T14:30:00.000Z"),
        actor: {
          id: "admin-1",
          name: "Admin Geral",
          role: Role.ADMIN,
        },
      },
    ];

    mocks.prisma.user.groupBy.mockImplementation(async () => {
      dbCallCount += 1;
      return [
        { role: Role.ESTUDANTE, _count: { _all: 12 } },
        { role: Role.EDUCADOR, _count: { _all: 5 } },
        { role: Role.ADMIN, _count: { _all: 1 } },
      ];
    });

    mocks.prisma.auditLog.findMany.mockImplementation(async () => {
      dbCallCount += 1;
      return auditLogs;
    });

    // Legacy stubs para que a execução RED complete e falhe na asserção de contagem/calls
    mocks.prisma.user.count.mockImplementation(async () => {
      dbCallCount += 1;
      return 0;
    });
    mocks.prisma.user.findMany.mockImplementation(async () => {
      dbCallCount += 1;
      return [];
    });
    mocks.prisma.institution.count.mockImplementation(async () => {
      dbCallCount += 1;
      return 3;
    });
    mocks.prisma.classroom.count.mockImplementation(async () => {
      dbCallCount += 1;
      return 8;
    });
    mocks.prisma.courseItem.count.mockImplementation(async () => {
      dbCallCount += 1;
      return 1;
    });

    const rawCalls: Array<{ sql: string; values: unknown[] }> = [];
    mocks.prisma.$queryRaw.mockImplementation(
      async (strings: TemplateStringsArray, ...values: unknown[]) => {
        dbCallCount += 1;
        const sql = strings.join(" ? ");
        rawCalls.push({ sql, values });

        if (sql.includes("month_key")) {
          return [
            {
              month_key: "2026-06",
              role: Role.ESTUDANTE,
              total: BigInt(4),
            },
            {
              month_key: "2026-09",
              role: Role.EDUCADOR,
              total: 2,
            },
            {
              month_key: "2026-11",
              role: Role.ESTUDANTE,
              total: BigInt(7),
            },
            {
              month_key: "2026-11",
              role: Role.EDUCADOR,
              total: BigInt(1),
            },
          ];
        }

        if (sql.includes("descobrir") && sql.includes("activeInstitutions")) {
          return [
            {
              activeInstitutions: BigInt(3),
              activeClassrooms: BigInt(8),
              brokenCourseLinks: 1,
              descobrir: BigInt(10),
              aprender: BigInt(7),
              experimentar: BigInt(4),
              construir: 3,
            },
          ];
        }

        if (sql.includes("descobrir")) {
          return [
            {
              descobrir: BigInt(10),
              aprender: BigInt(7),
              experimentar: BigInt(4),
              construir: 3,
            },
          ];
        }

        if (sql.includes("activeInstitutions")) {
          return [
            {
              activeInstitutions: BigInt(3),
              activeClassrooms: BigInt(8),
              brokenCourseLinks: 1,
            },
          ];
        }

        return [{ "?column?": 1 }];
      },
    );

    const data = await getAdminOverviewData();

    expect(dbCallCount).toBeLessThanOrEqual(5);
    expect(mocks.prisma.user.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.user.count).not.toHaveBeenCalled();
    expect(mocks.prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(mocks.prisma.user.groupBy).toHaveBeenCalledWith({
      by: ["role"],
      _count: { _all: true },
    });

    const monthlyRawCall = rawCalls.find((call) =>
      call.sql.includes("month_key"),
    );
    expect(monthlyRawCall).toBeDefined();
    expect(monthlyRawCall?.values[0]).toEqual(
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(data.kpis).toEqual({
      totalUsers: 18,
      totalStudents: 12,
      totalEducators: 5,
      activeInstitutions: 3,
      activeClassrooms: 8,
      brokenCourseLinks: 1,
      dbHealthy: true,
    });

    expect(data.monthlyRegistrations).toHaveLength(6);
    expect(data.monthlyRegistrations.map((b) => [b.estudantes, b.educadores])).toEqual([
      [4, 0],
      [0, 0],
      [0, 0],
      [0, 2],
      [0, 0],
      [7, 1],
    ]);

    expect(data.stageFunnel).toEqual([
      { stage: "Descobrir", count: 10 },
      { stage: "Aprender", count: 7 },
      { stage: "Experimentar", count: 4 },
      { stage: "Construir", count: 3 },
    ]);

    expect(data.recentAuditLogs).toEqual(auditLogs);
  });

  it("PERF-09 / PERF-13: getSharedPortfolioByToken com includeReadiness=true dispara projetos e prontidão em paralelo (estágio único)", async () => {
    const rawToken = "parallel-share-token";
    const projectsDeferred = createDeferred<
      Array<{
        id: string;
        title: string;
        summary: string;
        reflection: string;
        externalUrl: string | null;
        challenge: { title: string; macroArea: { slug: string } } | null;
        evidenceFiles: never[];
      }>
    >();

    const findUniqueShareLink = vi.fn().mockResolvedValue({
      studentId: "stu-1",
      active: true,
      revokedAt: null,
      includeReadiness: true,
      student: { name: "Ana Clara", status: "ACTIVE" },
    });
    const findManyProjects = vi.fn().mockReturnValue(projectsDeferred.promise);
    const findFirstDiscovery = vi.fn().mockResolvedValue({
      scoresJson: { "tecnologia-dados": 90 },
      topAreas: ["tecnologia-dados"],
    });
    const findManyCourseProgress = vi.fn().mockResolvedValue([
      {
        courseItem: {
          track: { macroArea: { slug: "tecnologia-dados" } },
        },
      },
    ]);
    const findManyMacroArea = vi.fn().mockResolvedValue(SAMPLE_MACRO_AREAS);

    const pendingPromise = getSharedPortfolioByToken(rawToken, {
      portfolioShareLink: { findUnique: findUniqueShareLink },
      portfolioProject: { findMany: findManyProjects },
      discoveryResult: { findFirst: findFirstDiscovery },
      courseProgress: { findMany: findManyCourseProgress },
      macroArea: { findMany: findManyMacroArea },
    } as never);

    await flushMicrotasks();

    // Todas as queries devem já ter sido disparadas ANTES de portfolioProject.findMany resolver
    expect(findUniqueShareLink).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: hashShareToken(rawToken) },
      }),
    );
    expect(findManyProjects).toHaveBeenCalledTimes(1);
    expect(findFirstDiscovery).toHaveBeenCalledTimes(1);
    expect(findManyCourseProgress).toHaveBeenCalledTimes(1);
    expect(findManyMacroArea).toHaveBeenCalledTimes(1);

    projectsDeferred.resolve([
      {
        id: "proj-1",
        title: "Painel",
        summary: "Resumo",
        reflection: "Reflexão completa.",
        externalUrl: null,
        challenge: {
          title: "Desafio Dados",
          macroArea: { slug: "tecnologia-dados" },
        },
        evidenceFiles: [],
      },
    ]);

    const result = await pendingPromise;
    expect(result?.readinessSummary).toEqual({
      completedCoursesCount: 1,
      completedChallengesCount: 1,
      totalProjectsCount: 1,
      topAreas: [
        {
          slug: "tecnologia-dados",
          name: "Tecnologia e Dados",
          affinityScore: 90,
          provenScore: 85,
          publicStatusLabel: "Prática comprovada",
          entryRoles: ["Jovem Aprendiz em Suporte de TI"],
        },
      ],
    });
  });

  it("PERF-09 / PERF-13: getSharedPortfolioByToken com prisma padrão usa getCachedMacroAreas() em paralelo", async () => {
    const projectsDeferred = createDeferred<never[]>();

    mocks.prisma.portfolioShareLink.findUnique.mockResolvedValue({
      studentId: "stu-2",
      active: true,
      revokedAt: null,
      includeReadiness: true,
      student: { name: "Lucas", status: "ACTIVE" },
    });
    mocks.prisma.portfolioProject.findMany.mockReturnValue(
      projectsDeferred.promise,
    );
    mocks.prisma.discoveryResult.findFirst.mockResolvedValue({
      scoresJson: { "tecnologia-dados": 80 },
      topAreas: ["tecnologia-dados"],
    });
    mocks.prisma.courseProgress.findMany.mockResolvedValue([]);
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);

    const pending = getSharedPortfolioByToken("default-prisma-token");
    await flushMicrotasks();

    expect(mocks.prisma.portfolioProject.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.discoveryResult.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.courseProgress.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.getCachedMacroAreas).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.macroArea.findMany).not.toHaveBeenCalled();

    projectsDeferred.resolve([]);
    const result = await pending;
    expect(result?.readinessSummary?.topAreas[0]?.name).toBe(
      "Tecnologia e Dados",
    );
  });

  it("PERF-09 / PERF-13: getClassroomEducationalView com prisma padrão dispara getCachedMacroAreas() em paralelo com classroom.findUnique", async () => {
    const classroomDeferred = createDeferred<unknown>();

    mocks.prisma.classroom.findUnique.mockReturnValue(
      classroomDeferred.promise,
    );
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);

    const pending = getClassroomEducationalView("class-1", "edu-1");
    await flushMicrotasks();

    expect(mocks.prisma.classroom.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.getCachedMacroAreas).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.macroArea.findMany).not.toHaveBeenCalled();

    classroomDeferred.resolve({
      id: "class-1",
      name: "3º Ano A",
      inviteCode: "VC-123",
      active: true,
      educatorId: "edu-1",
      institution: { name: "Escola Teste" },
      enrollments: [
        {
          student: {
            id: "stu-1",
            name: "Ana",
            status: "ACTIVE",
            discoveryResults: [{ topAreas: ["tecnologia-dados"] }],
            portfolioProjects: [],
            courseProgress: [],
          },
        },
      ],
    });

    const view = await pending;
    expect(view?.students[0]?.topMacroAreas).toEqual(["Tecnologia e Dados"]);
  });

  it("PERF-09 / PERF-13: páginas /app e /app/descobrir usam cache compartilhado, consolidam counts e eliminam waterfall", async () => {
    mocks.requireRole.mockResolvedValue({
      userId: "stu-1",
      name: "Ana Clara",
      role: Role.ESTUDANTE,
      institutionId: null,
    });
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);
    mocks.getCachedPublishedCourseCount.mockResolvedValue(14);
    mocks.getCachedDiscoveryQuestions.mockResolvedValue([
      {
        id: "q-1",
        prompt: "Cenário 1",
        order: 1,
        weightsByArea: { "tecnologia-dados": 3 },
        optionsJson: [
          { id: "opt-a", label: "Opção A", weightsByArea: { "tecnologia-dados": 3 } },
          { id: "opt-b", label: "Opção B", weightsByArea: { "design-criacao": 3 } },
        ],
      },
    ]);

    // /app dashboard
    mocks.prisma.discoveryResult.findFirst.mockResolvedValue({
      id: "dr-1",
      topAreas: ["tecnologia-dados"],
    });
    mocks.prisma.courseProgress.groupBy.mockResolvedValue([
      { status: "EM_ANDAMENTO", _count: { _all: 2 } },
      { status: "CONCLUIDO", _count: { _all: 1 } },
    ]);
    mocks.prisma.courseProgress.findFirst.mockResolvedValue(null);
    mocks.prisma.portfolioProject.findMany.mockResolvedValue([
      { challengeId: "ch-1" },
      { challengeId: null },
      { challengeId: null },
    ]);
    mocks.prisma.portfolioShareLink.findFirst.mockResolvedValue(null);
    mocks.prisma.macroArea.findMany.mockResolvedValue([]);
    mocks.prisma.courseItem.count.mockResolvedValue(0);
    mocks.prisma.courseProgress.count.mockResolvedValue(0);
    mocks.prisma.portfolioProject.count.mockResolvedValue(0);

    await StudentDashboardPage();

    expect(mocks.getCachedMacroAreas).toHaveBeenCalledTimes(1);
    expect(mocks.getCachedPublishedCourseCount).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.courseProgress.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: {
        studentId: "stu-1",
        status: { in: ["EM_ANDAMENTO", "CONCLUIDO"] },
      },
      _count: { _all: true },
    });
    expect(mocks.prisma.portfolioProject.findMany).toHaveBeenCalledWith({
      where: { studentId: "stu-1" },
      select: { challengeId: true },
    });
    expect(mocks.prisma.macroArea.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.courseItem.count).not.toHaveBeenCalled();
    expect(mocks.prisma.courseProgress.count).not.toHaveBeenCalled();
    expect(mocks.prisma.portfolioProject.count).not.toHaveBeenCalled();

    // /app/descobrir: getStudentProvenPractice deve iniciar em paralelo com as demais queries
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      userId: "stu-1",
      name: "Ana Clara",
      role: Role.ESTUDANTE,
      institutionId: null,
    });
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);
    mocks.getCachedDiscoveryQuestions.mockResolvedValue([]);
    mocks.prisma.track.findMany.mockResolvedValue([]);
    mocks.prisma.challenge.findMany.mockResolvedValue([]);

    const discoveryResultsDeferred = createDeferred<never[]>();
    mocks.prisma.discoveryResult.findMany.mockReturnValue(
      discoveryResultsDeferred.promise,
    );
    mocks.prisma.courseProgress.findMany.mockResolvedValue([
      {
        courseItem: {
          track: { macroArea: { slug: "tecnologia-dados" } },
        },
      },
    ]);
    mocks.prisma.portfolioProject.findMany.mockResolvedValue([]);

    const descobrirPromise = DescobrirPage();
    await flushMicrotasks();

    expect(mocks.getCachedDiscoveryQuestions).toHaveBeenCalledTimes(1);
    expect(mocks.getCachedMacroAreas).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.courseProgress.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.portfolioProject.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.discoveryQuestion.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.macroArea.findMany).not.toHaveBeenCalled();

    discoveryResultsDeferred.resolve([]);
    const descobrirElement = (await descobrirPromise) as {
      props: {
        provenPractice: {
          byArea: Record<
            string,
            { completedCourses: number; challengeProjects: number; score: number }
          >;
        };
      };
    };
    expect(descobrirElement.props.provenPractice.byArea).toEqual({
      "tecnologia-dados": {
        completedCourses: 1,
        challengeProjects: 0,
        score: 35,
      },
      "design-criacao": {
        completedCourses: 0,
        challengeProjects: 0,
        score: 0,
      },
    });
  });

  it("PERF-09 / PERF-13: /app/aprender e /app/experimentar usam getCachedMacroAreas() e paralelizam listagem quando area != 'recomendadas'", async () => {
    mocks.requireRole.mockResolvedValue({
      userId: "stu-1",
      name: "Ana Clara",
      role: Role.ESTUDANTE,
      institutionId: null,
    });
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);

    const aprenderDiscoveryDeferred = createDeferred<{ topAreas: string[] } | null>();
    mocks.prisma.discoveryResult.findFirst.mockReturnValue(
      aprenderDiscoveryDeferred.promise,
    );
    mocks.prisma.track.findMany.mockResolvedValue([]);
    mocks.prisma.track.groupBy.mockResolvedValue([
      { macroAreaId: "ma-1", _count: { _all: 1 } },
      { macroAreaId: "ma-2", _count: { _all: 2 } },
    ]);

    const aprenderPromise = AprenderPage({
      searchParams: Promise.resolve({ area: "tecnologia-dados" }),
    });
    await flushMicrotasks();

    expect(mocks.getCachedMacroAreas).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.track.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.macroArea.findMany).not.toHaveBeenCalled();

    aprenderDiscoveryDeferred.resolve({ topAreas: ["tecnologia-dados"] });
    await aprenderPromise;

    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      userId: "stu-1",
      name: "Ana Clara",
      role: Role.ESTUDANTE,
      institutionId: null,
    });
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);

    const experimentarDiscoveryDeferred = createDeferred<{ topAreas: string[] } | null>();
    mocks.prisma.discoveryResult.findFirst.mockReturnValue(
      experimentarDiscoveryDeferred.promise,
    );
    mocks.prisma.challenge.findMany.mockResolvedValue([]);
    mocks.prisma.challenge.groupBy.mockResolvedValue([
      { macroAreaId: "ma-2", _count: { _all: 3 } },
    ]);

    const experimentarPromise = ExperimentarPage({
      searchParams: Promise.resolve({ area: "tecnologia-dados" }),
    });
    await flushMicrotasks();

    expect(mocks.getCachedMacroAreas).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.challenge.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.macroArea.findMany).not.toHaveBeenCalled();

    experimentarDiscoveryDeferred.resolve({ topAreas: ["tecnologia-dados"] });
    await experimentarPromise;

    // Default unfiltered view ("") computes area counts directly from tracks/challenges without extra groupBy
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      userId: "stu-1",
      name: "Ana Clara",
      role: Role.ESTUDANTE,
      institutionId: null,
    });
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);
    mocks.prisma.discoveryResult.findFirst.mockResolvedValue({
      topAreas: ["tecnologia-dados"],
    });
    mocks.prisma.track.findMany.mockResolvedValue([
      {
        id: "t-1",
        title: "Trilha 1",
        description: "Desc",
        macroArea: { slug: "tecnologia-dados", name: "Tecnologia e Dados" },
        courses: [],
      },
    ]);
    await AprenderPage({ searchParams: Promise.resolve({}) });
    expect(mocks.prisma.track.groupBy).not.toHaveBeenCalled();

    // Recommended view ("recomendadas") skips tracks query altogether when student has no topAreas
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      userId: "stu-1",
      name: "Ana Clara",
      role: Role.ESTUDANTE,
      institutionId: null,
    });
    mocks.getCachedMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);
    mocks.prisma.discoveryResult.findFirst.mockResolvedValue(null);
    mocks.prisma.track.groupBy.mockResolvedValue([]);
    await AprenderPage({
      searchParams: Promise.resolve({ area: "recomendadas" }),
    });
    expect(mocks.prisma.track.findMany).not.toHaveBeenCalled();
  });

  it("PERF-02: listagens administrativas aplicam take: 200 em instituições, educadores e turmas", async () => {
    mocks.requireRole.mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      role: Role.ADMIN,
      institutionId: null,
    });
    mocks.requireApiRole.mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      role: Role.ADMIN,
      institutionId: null,
    });
    mocks.prisma.institution.findMany.mockResolvedValue([]);
    mocks.prisma.user.findMany.mockResolvedValue([]);
    mocks.prisma.classroom.findMany.mockResolvedValue([]);

    await AdminInstitutionsPage();
    expect(mocks.prisma.institution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );

    vi.clearAllMocks();
    mocks.requireApiRole.mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      role: Role.ADMIN,
      institutionId: null,
    });
    mocks.prisma.institution.findMany.mockResolvedValue([]);
    mocks.prisma.user.findMany.mockResolvedValue([]);
    mocks.prisma.classroom.findMany.mockResolvedValue([]);

    const instRes = await getAdminInstitutions();
    expect(instRes.status).toBe(200);
    expect(mocks.prisma.institution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );

    const classRes = await getAdminClassrooms(
      new Request("http://localhost/api/admin/classrooms"),
    );
    expect(classRes.status).toBe(200);
    expect(mocks.prisma.classroom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );
  });
});
