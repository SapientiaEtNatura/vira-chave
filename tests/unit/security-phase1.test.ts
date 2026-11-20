import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkExternalLink, type CheckedRequestFn } from "@/lib/link-checker";
import {
  createPortfolioProject,
  MAX_PROJECT_REFLECTION_LENGTH,
  MAX_PROJECT_SUMMARY_LENGTH,
  MAX_PROJECT_TITLE_LENGTH,
  PortfolioServiceError,
} from "@/lib/portfolio/portfolio-service";

describe("Fase 1 — Correções de Segurança e Validação", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("SEC-02: bloqueia redirecionamento HTTP 302 para IP privado/loopback no checkExternalLink", async () => {
    const requestFn = vi.fn<CheckedRequestFn>().mockResolvedValueOnce({
      status: 302,
      ok: false,
      location: "http://127.0.0.1:5432/internal",
    });

    // 93.184.216.34 é IP público (não dispara DNS lookup, passa na checagem inicial)
    const result = await checkExternalLink("https://93.184.216.34/curso", {
      requestFn,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(result.reason).toMatch(/privado|reservado|local/i);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestFn).toHaveBeenCalledWith(
      "https://93.184.216.34/curso",
      "HEAD",
      { address: "93.184.216.34", family: 4 },
    );
  });

  it("SEC-02: bloqueia cadeia excessiva de redirecionamentos (> 3 saltos)", async () => {
    const requestFn = vi.fn<CheckedRequestFn>().mockResolvedValue({
      status: 302,
      ok: false,
      location: "https://93.184.216.34/next",
    });

    const result = await checkExternalLink("https://93.184.216.34/start", {
      requestFn,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/limite de redirecionamentos/i);
    expect(requestFn).toHaveBeenCalledTimes(4);
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
