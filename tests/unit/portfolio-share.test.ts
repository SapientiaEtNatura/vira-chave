import { describe, expect, it, vi } from "vitest";
import {
  generateShareLink,
  getSharedPortfolioByToken,
  revokeShareLinks,
} from "@/lib/portfolio/portfolio-service";
import { hashShareToken } from "@/lib/portfolio/share-token";

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
      student: { name: string };
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
            student: { name: "Lucas Silva" },
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
});
