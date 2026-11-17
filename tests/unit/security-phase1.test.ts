import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkExternalLink } from "@/lib/link-checker";
import {
  createPortfolioProject,
  MAX_PROJECT_REFLECTION_LENGTH,
  MAX_PROJECT_SUMMARY_LENGTH,
  MAX_PROJECT_TITLE_LENGTH,
  PortfolioServiceError,
} from "@/lib/portfolio/portfolio-service";

describe("Fase 1 — Correções de Segurança e Validação", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("SEC-02: bloqueia redirecionamento HTTP 302 para IP privado/loopback no checkExternalLink", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1:5432/internal" },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    // 93.184.216.34 é IP público (não dispara DNS lookup, passa na checagem inicial)
    const result = await checkExternalLink("https://93.184.216.34/curso");

    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(result.reason).toMatch(/privado|reservado|local/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ redirect: "manual" });
  });

  it("SEC-02: bloqueia cadeia excessiva de redirecionamentos (> 3 saltos)", async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://93.184.216.34/next" },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await checkExternalLink("https://93.184.216.34/start");

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/limite de redirecionamentos/i);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("QA-02: rejeita criação de projeto no portfólio acima dos limites máximos", async () => {
    const mockPrisma = {} as NonNullable<
      Parameters<typeof createPortfolioProject>[1]
    >["prismaClient"];

    await expect(
      createPortfolioProject(
        {
          studentId: "stu-1",
          title: "a".repeat(MAX_PROJECT_TITLE_LENGTH + 1),
          reflection: "Reflexão válida com mais de dez caracteres.",
        },
        { prismaClient: mockPrisma },
      ),
    ).rejects.toThrow(PortfolioServiceError);

    await expect(
      createPortfolioProject(
        {
          studentId: "stu-1",
          title: "Título válido",
          summary: "b".repeat(MAX_PROJECT_SUMMARY_LENGTH + 1),
          reflection: "Reflexão válida com mais de dez caracteres.",
        },
        { prismaClient: mockPrisma },
      ),
    ).rejects.toThrow(PortfolioServiceError);

    await expect(
      createPortfolioProject(
        {
          studentId: "stu-1",
          title: "Título válido",
          reflection: "c".repeat(MAX_PROJECT_REFLECTION_LENGTH + 1),
        },
        { prismaClient: mockPrisma },
      ),
    ).rejects.toThrow(PortfolioServiceError);
  });
});
