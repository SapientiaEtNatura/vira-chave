import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  auth: vi.fn(),
  authorizeAndReadFile: vi.fn(),
  findManyQuestions: vi.fn(),
  createDiscoveryResult: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireApiRole: mocks.requireApiRole,
  STUDENT_PORTAL_ROLES: [Role.ESTUDANTE, Role.ADMIN],
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/files/authorize-file", () => ({
  authorizeAndReadFile: mocks.authorizeAndReadFile,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    discoveryQuestion: {
      findMany: mocks.findManyQuestions,
    },
    discoveryResult: {
      create: mocks.createDiscoveryResult,
    },
  },
}));

import { GET as getFileRoute } from "@/app/api/files/[fileId]/route";
import { POST as submitDiscoveryPost } from "@/app/api/discovery/submit/route";
import {
  completeCourseProgress,
  CourseProgressError,
  MAX_COURSE_NOTES_LENGTH,
} from "@/lib/aprender/progress";
import {
  ChallengeSubmissionError,
  MAX_CHALLENGE_REFLECTION_LENGTH,
  MAX_CHALLENGE_TITLE_LENGTH,
  submitChallenge,
} from "@/lib/experimentar/submit-challenge";
import { validateExternalUrlStructure } from "@/lib/link-checker";
import { SHARE_TOKEN_COOKIE_NAME } from "@/lib/portfolio/share-token";
import { strongPasswordSchema } from "@/lib/validations/auth";
import { middleware } from "@/middleware";

describe("Fase 4 — Hardening CSRF, Share Token Cookie, SSRF, Limites e Política de Senha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia POST cross-origin em APIs, permite same-origin e define cookie HttpOnly em /p/[token]", () => {
    const crossOriginReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "https://evil.example",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    const crossOriginRes = middleware(crossOriginReq);
    expect(crossOriginRes.status).toBe(403);

    const sameOriginReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    const sameOriginRes = middleware(sameOriginReq);
    expect(sameOriginRes.status).toBe(200);

    const token = "AbCdEfGhIjKlMnOpQrStUvWx1234";
    const sharePageReq = new NextRequest(`http://localhost:3000/p/${token}`, {
      method: "GET",
    });
    const sharePageRes = middleware(sharePageReq);
    expect(sharePageRes.status).toBe(200);

    const cookie = sharePageRes.cookies.get(SHARE_TOKEN_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(token);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe("/api/files");
    expect(cookie?.sameSite).toBe("lax");
  });

  it("autoriza GET /api/files/[fileId] via cookie __vc_share_token sem expor token na URL", async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.authorizeAndReadFile.mockResolvedValue({
      ok: true,
      file: {
        id: "file-99",
        originalName: "evidencia.png",
        mimeType: "image/png",
        sizeBytes: 12,
      },
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    });

    const token = "ShareCookieToken_9876543210";
    const req = new Request("http://localhost:3000/api/files/file-99", {
      headers: {
        cookie: `${SHARE_TOKEN_COOKIE_NAME}=${token}`,
      },
    });
    const res = await getFileRoute(req, {
      params: Promise.resolve({ fileId: "file-99" }),
    });

    expect(res.status).toBe(200);
    expect(mocks.authorizeAndReadFile).toHaveBeenCalledWith({
      fileId: "file-99",
      sessionUser: null,
      shareToken: token,
    });
  });

  it("validateExternalUrlStructure bloqueia IPs privados, hostnames internos e credenciais na URL", () => {
    const blockedUrls = [
      "http://127.0.0.1/x",
      "http://169.254.169.254/latest",
      "http://localhost:3000",
      "https://intranet.internal",
      "https://user:pass@example.com",
    ];
    for (const url of blockedUrls) {
      expect(validateExternalUrlStructure(url).safe).toBe(false);
    }

    expect(
      validateExternalUrlStructure(
        "https://www.cursoemvideo.com/curso/curso-de-algoritmo/",
      ).safe,
    ).toBe(true);
  });

  it("strongPasswordSchema rejeita senhas fracas e aceita senhas fortes", () => {
    expect(strongPasswordSchema.safeParse("12345678").success).toBe(false);
    expect(strongPasswordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(strongPasswordSchema.safeParse("ABCDEFGH1").success).toBe(false);
    expect(strongPasswordSchema.safeParse("NovaSenhaForte456").success).toBe(
      true,
    );
  });

  it("aplica limites máximos em submitChallenge/completeCourseProgress e rejeita questões desconhecidas em discovery/submit", async () => {
    const mockPrisma = {} as never;

    await expect(
      submitChallenge(
        {
          studentId: "stu-1",
          challengeId: "ch-1",
          title: "a".repeat(MAX_CHALLENGE_TITLE_LENGTH + 1),
          reflection: "Reflexão válida com mais de dez caracteres.",
        },
        { prismaClient: mockPrisma },
      ),
    ).rejects.toThrow(ChallengeSubmissionError);

    await expect(
      submitChallenge(
        {
          studentId: "stu-1",
          challengeId: "ch-1",
          title: "Título válido",
          reflection: "b".repeat(MAX_CHALLENGE_REFLECTION_LENGTH + 1),
        },
        { prismaClient: mockPrisma },
      ),
    ).rejects.toThrow(ChallengeSubmissionError);

    await expect(
      completeCourseProgress(
        {
          studentId: "stu-1",
          courseItemId: "course-1",
          notes: "c".repeat(MAX_COURSE_NOTES_LENGTH + 1),
        },
        { prismaClient: mockPrisma },
      ),
    ).rejects.toThrow(CourseProgressError);

    mocks.requireApiRole.mockResolvedValue({
      userId: "stu-1",
      role: Role.ESTUDANTE,
      institutionId: "inst-1",
    });
    mocks.findManyQuestions.mockResolvedValue([
      { id: "q-1", order: 1, weightsByArea: {} },
    ]);

    const discoveryReq = new Request("http://localhost:3000/api/discovery/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answers: {
          "q-1": 5,
          "q-inexistente": 3,
        },
      }),
    });
    const discoveryRes = await submitDiscoveryPost(discoveryReq);
    expect(discoveryRes.status).toBe(400);
    expect(mocks.createDiscoveryResult).not.toHaveBeenCalled();
  });
});
