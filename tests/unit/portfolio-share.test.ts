import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

const routeMocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  recordAuditLog: vi.fn(),
  findFirstShareLink: vi.fn(),
  updateManyShareLink: vi.fn(),
  createShareLink: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireApiRole: routeMocks.requireApiRole,
  STUDENT_PORTAL_ROLES: [Role.ESTUDANTE, Role.ADMIN],
}));

vi.mock("@/lib/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit")>();
  return {
    ...actual,
    recordAuditLog: routeMocks.recordAuditLog,
  };
});

vi.mock("@/lib/db", () => {
  const shareLink = {
    findFirst: routeMocks.findFirstShareLink,
    updateMany: routeMocks.updateManyShareLink,
    create: routeMocks.createShareLink,
  };
  return {
    prisma: {
      portfolioShareLink: shareLink,
      $transaction: vi.fn(
        async (cb: (client: { portfolioShareLink: typeof shareLink }) => unknown) =>
          cb({ portfolioShareLink: shareLink }),
      ),
    },
  };
});

import { AUDIT_ACTIONS } from "@/lib/audit";
import {
  generateShareLink,
  getSharedPortfolioByToken,
  revokeShareLinks,
  updateShareLinkPreferences,
} from "@/lib/portfolio/portfolio-service";
import { hashShareToken } from "@/lib/portfolio/share-token";
import {
  GET as getShareRoute,
  PATCH as patchShareRoute,
  POST as postShareRoute,
} from "@/app/api/portfolio/share/route";

describe("Etapa Construir — Portfólio Privado e Link Compartilhável Revogável", () => {
  it("test_portfolio_share_link_shows_only_included_projects_and_no_pii", async () => {
    const rawToken = "valid-share-token-abc123";
    const expectedHash = hashShareToken(rawToken);

    const findUniqueShareLink = vi.fn().mockResolvedValue({
      id: "link-1",
      studentId: "student-1",
      tokenHash: expectedHash,
      active: true,
      revokedAt: null,
      student: {
        id: "student-1",
        name: "Ana Clara",
        status: "ACTIVE",
        email: "ana.clara@escola.edu.br",
        institution: { name: "Escola Estadual Modelo" },
        enrollments: [{ classroom: { name: "3º Ano B" } }],
      },
    });

    const findManyProjects = vi.fn().mockResolvedValue([
      {
        id: "proj-public",
        title: "Horta Comunitária Digital",
        summary: "Sistema simples para organizar turnos de rega.",
        reflection: "Aprendi a ouvir moradores e iterar rápido.",
        externalUrl: "https://example.com/horta",
        isIncludedInShare: true,
        challenge: { title: "Solução Local" },
        evidenceFiles: [
          {
            id: "file-1",
            originalName: "prototipo.png",
            mimeType: "image/png",
            sizeBytes: 2048,
          },
        ],
      },
    ]);

    const prismaMock = {
      portfolioShareLink: {
        findUnique: findUniqueShareLink,
      },
      portfolioProject: {
        findMany: findManyProjects,
      },
    };

    const result = await getSharedPortfolioByToken(
      rawToken,
      prismaMock as never,
    );

    expect(findUniqueShareLink).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: expectedHash },
      }),
    );
    expect(findManyProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentId: "student-1",
          isIncludedInShare: true,
        },
      }),
    );

    expect(result).not.toBeNull();
    expect(result?.studentDisplayName).toBe("Ana Clara");
    expect(result?.projects).toHaveLength(1);
    expect(result?.projects[0]).toEqual({
      id: "proj-public",
      title: "Horta Comunitária Digital",
      summary: "Sistema simples para organizar turnos de rega.",
      reflection: "Aprendi a ouvir moradores e iterar rápido.",
      externalUrl: "https://example.com/horta",
      challengeTitle: "Solução Local",
      evidenceFiles: [
        {
          id: "file-1",
          originalName: "prototipo.png",
          mimeType: "image/png",
          sizeBytes: 2048,
        },
      ],
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("ana.clara@escola.edu.br");
    expect(serialized).not.toContain("Escola Estadual Modelo");
    expect(serialized).not.toContain("3º Ano B");
    expect(result as unknown as Record<string, unknown>).not.toHaveProperty("email");
    expect(result as unknown as Record<string, unknown>).not.toHaveProperty("classroom");
    expect(result as unknown as Record<string, unknown>).not.toHaveProperty("institution");
  });

  it("test_revoked_share_link_returns_not_found", async () => {
    type MockActiveLink = {
      id: string;
      studentId: string;
      tokenHash: string;
      active: boolean;
      revokedAt: Date | null;
      student: { name: string; status: string };
    };
    const state: { activeLink: MockActiveLink | null } = { activeLink: null };

    const tx = {
      portfolioShareLink: {
        updateMany: vi.fn(async ({ where, data }) => {
          if (
            state.activeLink &&
            state.activeLink.studentId === where.studentId &&
            state.activeLink.active === where.active
          ) {
            state.activeLink = {
              ...state.activeLink,
              active: data.active,
              revokedAt: data.revokedAt,
            };
          }
          return { count: 1 };
        }),
        create: vi.fn(async ({ data }) => {
          const createdLink: MockActiveLink = {
            id: "link-new",
            studentId: data.studentId,
            tokenHash: data.tokenHash,
            active: data.active ?? true,
            revokedAt: null,
            student: { name: "Lucas Silva", status: "ACTIVE" },
          };
          state.activeLink = createdLink;
          return {
            id: createdLink.id,
            studentId: createdLink.studentId,
            tokenHash: createdLink.tokenHash,
            active: createdLink.active,
            createdAt: new Date("2026-11-14T12:00:00Z"),
            revokedAt: null,
          };
        }),
      },
    };

    const prismaMock = {
      portfolioShareLink: {
        updateMany: tx.portfolioShareLink.updateMany,
        findUnique: vi.fn(async ({ where }) => {
          if (state.activeLink && state.activeLink.tokenHash === where.tokenHash) {
            return state.activeLink;
          }
          return null;
        }),
      },
      portfolioProject: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) =>
        cb(tx),
      ),
    };

    const generated = await generateShareLink("student-2", prismaMock as never);
    expect(generated.rawToken).toBeTruthy();
    expect(generated.createdAt).toBeInstanceOf(Date);
    expect(state.activeLink?.tokenHash).toBe(hashShareToken(generated.rawToken));
    expect(state.activeLink?.tokenHash).not.toBe(generated.rawToken);

    const beforeRevoke = await getSharedPortfolioByToken(
      generated.rawToken,
      prismaMock as never,
    );
    expect(beforeRevoke).not.toBeNull();

    await revokeShareLinks("student-2", prismaMock as never);

    const afterRevoke = await getSharedPortfolioByToken(
      generated.rawToken,
      prismaMock as never,
    );
    expect(afterRevoke).toBeNull();
  });

  it("test_include_readiness_false_returns_null_and_skips_discovery_queries", async () => {
    const rawToken = "opt-out-token-123";
    const findUniqueShareLink = vi.fn().mockResolvedValue({
      studentId: "student-1",
      active: true,
      revokedAt: null,
      includeReadiness: false,
      student: { name: "Ana Clara", status: "ACTIVE" },
    });
    const findManyProjects = vi.fn().mockResolvedValue([]);
    const findFirstDiscovery = vi.fn();
    const findManyCourseProgress = vi.fn();
    const findManyMacroArea = vi.fn();

    const result = await getSharedPortfolioByToken(rawToken, {
      portfolioShareLink: { findUnique: findUniqueShareLink },
      portfolioProject: { findMany: findManyProjects },
      discoveryResult: { findFirst: findFirstDiscovery },
      courseProgress: { findMany: findManyCourseProgress },
      macroArea: { findMany: findManyMacroArea },
    } as never);

    expect(result).not.toBeNull();
    expect(result?.readinessSummary).toBeNull();
    expect(findFirstDiscovery).not.toHaveBeenCalled();
    expect(findManyCourseProgress).not.toHaveBeenCalled();
    expect(findManyMacroArea).not.toHaveBeenCalled();
  });

  it("test_include_readiness_true_computes_summary_without_self_practice_or_private_projects_or_pii", async () => {
    const rawToken = "opt-in-token-456";
    const findUniqueShareLink = vi.fn().mockResolvedValue({
      studentId: "student-1",
      active: true,
      revokedAt: null,
      includeReadiness: true,
      student: {
        name: "Ana Clara",
        status: "ACTIVE",
        email: "ana.clara@escola.edu.br",
        institution: { name: "Escola Estadual Modelo" },
        enrollments: [{ classroom: { name: "3º Ano B" } }],
      },
    });

    const findManyProjects = vi.fn().mockResolvedValue([
      {
        id: "proj-public-1",
        title: "Painel Solar Escolar",
        summary: "Monitoramento simples de consumo.",
        reflection: "Aprendi a medir dados com colegas.",
        externalUrl: null,
        challenge: {
          title: "Eficiência Energética",
          macroArea: { slug: "tecnologia-dados" },
        },
        evidenceFiles: [],
      },
      {
        id: "proj-public-free",
        title: "Projeto Livre Pessoal",
        summary: "Resumo livre.",
        reflection: "Reflexão livre sobre projeto pessoal.",
        externalUrl: null,
        challenge: null,
        evidenceFiles: [],
      },
    ]);

    const findFirstDiscovery = vi.fn().mockResolvedValue({
      scoresJson: {
        "tecnologia-dados": 90,
        "design-criacao": 75,
        "negocios-empreendedorismo": 60,
      },
      topAreas: [
        "tecnologia-dados",
        "design-criacao",
        "negocios-empreendedorismo",
      ],
      selfPracticeJson: {
        "negocios-empreendedorismo": 2,
      },
    });

    const findManyCourseProgress = vi.fn().mockResolvedValue([
      {
        courseItem: {
          track: {
            macroArea: { slug: "tecnologia-dados" },
          },
        },
      },
      {
        courseItem: {
          track: {
            macroArea: { slug: "design-criacao" },
          },
        },
      },
    ]);

    const findManyMacroArea = vi.fn().mockResolvedValue([
      {
        slug: "tecnologia-dados",
        name: "Tecnologia e Dados",
        entryRoles: ["Jovem Aprendiz em Suporte de TI"],
      },
      {
        slug: "design-criacao",
        name: "Design e Criação Digital",
        entryRoles: ["Assistente de Criação Digital"],
      },
      {
        slug: "negocios-empreendedorismo",
        name: "Negócios e Empreendedorismo",
        entryRoles: ["Jovem Aprendiz Administrativo"],
      },
    ]);

    const result = await getSharedPortfolioByToken(rawToken, {
      portfolioShareLink: { findUnique: findUniqueShareLink },
      portfolioProject: { findMany: findManyProjects },
      discoveryResult: { findFirst: findFirstDiscovery },
      courseProgress: { findMany: findManyCourseProgress },
      macroArea: { findMany: findManyMacroArea },
    } as never);

    expect(findManyProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentId: "student-1",
          isIncludedInShare: true,
        },
      }),
    );

    const discoveryCallArg = findFirstDiscovery.mock.calls[0]?.[0];
    expect(discoveryCallArg?.select).toBeDefined();
    expect(discoveryCallArg?.select).not.toHaveProperty("selfPracticeJson");

    expect(result?.readinessSummary).toEqual({
      completedCoursesCount: 2,
      completedChallengesCount: 1,
      totalProjectsCount: 2,
      topAreas: [
        {
          slug: "tecnologia-dados",
          name: "Tecnologia e Dados",
          affinityScore: 90,
          provenScore: 85,
          publicStatusLabel: "Prática comprovada",
          entryRoles: ["Jovem Aprendiz em Suporte de TI"],
        },
        {
          slug: "design-criacao",
          name: "Design e Criação Digital",
          affinityScore: 75,
          provenScore: 35,
          publicStatusLabel: "Em formação",
          entryRoles: ["Assistente de Criação Digital"],
        },
        {
          slug: "negocios-empreendedorismo",
          name: "Negócios e Empreendedorismo",
          affinityScore: 60,
          provenScore: 0,
          publicStatusLabel: "Área de interesse",
          entryRoles: ["Jovem Aprendiz Administrativo"],
        },
      ],
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("ana.clara@escola.edu.br");
    expect(serialized).not.toContain("Escola Estadual Modelo");
    expect(serialized).not.toContain("3º Ano B");
    expect(serialized).not.toContain("selfPracticeJson");
  });

  it("test_include_readiness_true_without_discovery_uses_proven_practice_or_returns_null_when_empty", async () => {
    const basePrisma = {
      portfolioShareLink: {
        findUnique: vi.fn().mockResolvedValue({
          studentId: "student-3",
          active: true,
          revokedAt: null,
          includeReadiness: true,
          student: { name: "Bruno Lima", status: "ACTIVE" },
        }),
      },
      discoveryResult: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      macroArea: {
        findMany: vi.fn().mockResolvedValue([
          {
            slug: "comunicacao-conteudo",
            name: "Comunicação e Conteúdo",
            entryRoles: ["Jovem Aprendiz em Comunicação"],
          },
          {
            slug: "design-criacao",
            name: "Design e Criação Digital",
            entryRoles: ["Assistente de Criação Digital"],
          },
        ]),
      },
    };

    const withEvidence = await getSharedPortfolioByToken("tok-ev", {
      ...basePrisma,
      portfolioProject: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "p-1",
            title: "Campanha",
            summary: "Resumo",
            reflection: "Reflexão completa do desafio.",
            externalUrl: null,
            challenge: {
              title: "Roteiro",
              macroArea: { slug: "comunicacao-conteudo" },
            },
            evidenceFiles: [],
          },
        ]),
      },
      courseProgress: {
        findMany: vi.fn().mockResolvedValue([
          {
            courseItem: {
              track: { macroArea: { slug: "design-criacao" } },
            },
          },
        ]),
      },
    } as never);

    expect(withEvidence?.readinessSummary).toEqual({
      completedCoursesCount: 1,
      completedChallengesCount: 1,
      totalProjectsCount: 1,
      topAreas: [
        {
          slug: "comunicacao-conteudo",
          name: "Comunicação e Conteúdo",
          affinityScore: null,
          provenScore: 50,
          publicStatusLabel: "Prática comprovada",
          entryRoles: ["Jovem Aprendiz em Comunicação"],
        },
        {
          slug: "design-criacao",
          name: "Design e Criação Digital",
          affinityScore: null,
          provenScore: 35,
          publicStatusLabel: "Em formação",
          entryRoles: ["Assistente de Criação Digital"],
        },
      ],
    });

    const withoutEvidence = await getSharedPortfolioByToken("tok-empty", {
      ...basePrisma,
      portfolioProject: { findMany: vi.fn().mockResolvedValue([]) },
      courseProgress: { findMany: vi.fn().mockResolvedValue([]) },
    } as never);

    expect(withoutEvidence?.readinessSummary).toBeNull();
  });

  it("test_update_share_link_preferences_updates_active_link_without_changing_token_hash", async () => {
    const linkState = {
      id: "link-active",
      studentId: "student-9",
      tokenHash: "original-hash-stay-intact",
      active: true,
      revokedAt: null,
      includeReadiness: false,
    };

    const prismaMock = {
      portfolioShareLink: {
        updateMany: vi.fn(async ({ where, data }) => {
          if (
            linkState.studentId === where.studentId &&
            linkState.active === where.active &&
            linkState.revokedAt === where.revokedAt
          ) {
            linkState.includeReadiness = data.includeReadiness;
            return { count: 1 };
          }
          return { count: 0 };
        }),
      },
    };

    const updated = await updateShareLinkPreferences(
      "student-9",
      true,
      prismaMock as never,
    );
    expect(updated).toEqual({ updated: true, includeReadiness: true });
    expect(linkState.tokenHash).toBe("original-hash-stay-intact");
    expect(linkState.includeReadiness).toBe(true);

    const noActiveLink = await updateShareLinkPreferences(
      "student-missing",
      true,
      prismaMock as never,
    );
    expect(noActiveLink).toEqual({ updated: false, includeReadiness: true });
  });
});

describe("API /api/portfolio/share — Opt-in de Prontidão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireApiRole.mockResolvedValue({
      userId: "student-1",
      role: Role.ESTUDANTE,
      institutionId: "inst-1",
    });
  });

  it("GET retorna hasActiveLink, createdAt e includeReadiness", async () => {
    routeMocks.findFirstShareLink.mockResolvedValue({
      createdAt: new Date("2026-11-19T10:00:00Z"),
      includeReadiness: true,
    });

    const response = await getShareRoute();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      hasActiveLink: true,
      createdAt: "2026-11-19T10:00:00.000Z",
      includeReadiness: true,
    });
  });

  it("POST aceita corpo vazio (default false) e JSON opcional { includeReadiness: true }", async () => {
    routeMocks.updateManyShareLink.mockResolvedValue({ count: 0 });
    routeMocks.createShareLink.mockImplementation(async ({ data }) => ({
      createdAt: new Date("2026-11-19T11:00:00Z"),
      includeReadiness: data.includeReadiness,
    }));

    const emptyRes = await postShareRoute(
      new Request("http://localhost/api/portfolio/share", { method: "POST" }),
    );
    const emptyData = await emptyRes.json();
    expect(emptyRes.status).toBe(201);
    expect(emptyData.includeReadiness).toBe(false);
    expect(emptyData.rawToken).toBeTruthy();

    const optInRes = await postShareRoute(
      new Request("http://localhost/api/portfolio/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeReadiness: true }),
      }),
    );
    const optInData = await optInRes.json();
    expect(optInRes.status).toBe(201);
    expect(optInData.includeReadiness).toBe(true);
  });

  it("PATCH valida payload, retorna 404 sem link ativo e registra auditoria ao atualizar", async () => {
    const invalidRes = await patchShareRoute(
      new Request("http://localhost/api/portfolio/share", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeReadiness: "sim" }),
      }),
    );
    expect(invalidRes.status).toBe(400);

    routeMocks.updateManyShareLink.mockResolvedValueOnce({ count: 0 });
    const notFoundRes = await patchShareRoute(
      new Request("http://localhost/api/portfolio/share", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeReadiness: true }),
      }),
    );
    expect(notFoundRes.status).toBe(404);

    routeMocks.updateManyShareLink.mockResolvedValueOnce({ count: 1 });
    const okRes = await patchShareRoute(
      new Request("http://localhost/api/portfolio/share", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeReadiness: true }),
      }),
    );
    const okData = await okRes.json();
    expect(okRes.status).toBe(200);
    expect(okData).toEqual({ includeReadiness: true });
    expect(routeMocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "student-1",
        action: AUDIT_ACTIONS.PORTFOLIO_SHARE_UPDATED,
        targetType: "PortfolioShareLink",
      }),
    );
  });
});
