import { EventEmitter } from "node:events";
import https from "node:https";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  auth: vi.fn(),
  authorizeFileAccess: vi.fn(),
  openStoredFileStream: vi.fn(),
  findManyQuestions: vi.fn(),
  createDiscoveryResult: vi.fn(),
  dnsLookup: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  lookup: mocks.dnsLookup,
}));

vi.mock("@/lib/rbac", () => ({
  requireApiRole: mocks.requireApiRole,
  STUDENT_PORTAL_ROLES: [Role.ESTUDANTE, Role.ADMIN],
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/files/authorize-file", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/files/authorize-file")>();
  return {
    ...actual,
    authorizeFileAccess: mocks.authorizeFileAccess,
  };
});

vi.mock("@/lib/storage/local-files", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/storage/local-files")>();
  return {
    ...actual,
    openStoredFileStream: mocks.openStoredFileStream,
  };
});

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
import {
  checkExternalLink,
  isPrivateOrReservedIp,
  isSafeExternalUrl,
  validateExternalUrlStructure,
} from "@/lib/link-checker";
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
    mocks.authorizeFileAccess.mockResolvedValue({
      ok: true,
      storageKey: "stu-99/evidencia.png",
      file: {
        id: "file-99",
        originalName: "evidencia.png",
        mimeType: "image/png",
        sizeBytes: 4,
      },
    });
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    mocks.openStoredFileStream.mockResolvedValue({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(pngBytes);
          controller.close();
        },
      }),
      sizeBytes: pngBytes.length,
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
    expect(res.headers.get("Content-Length")).toBe(String(pngBytes.length));
    expect(mocks.authorizeFileAccess).toHaveBeenCalledWith({
      fileId: "file-99",
      sessionUser: null,
      shareToken: token,
    });
    expect(mocks.openStoredFileStream).toHaveBeenCalledWith(
      "stu-99/evidencia.png",
    );
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

  it("DELTA-01 / PERF-14: ignora globalThis.fetch patcheado, usa DNS pinning e reutiliza URL/IP no fallback HEAD -> GET", async () => {
    const originalFetch = globalThis.fetch;
    const patchedFetch = vi
      .fn()
      .mockRejectedValue(new Error("globalThis.fetch nao deve ser utilizado"));
    globalThis.fetch = patchedFetch as typeof fetch;

    try {
      mocks.dnsLookup
        .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
        .mockResolvedValueOnce([{ address: "1.1.1.1", family: 4 }]);

      const requestFn = vi
        .fn()
        .mockResolvedValueOnce({
          status: 302,
          ok: false,
          location: "https://cdn.example.com/curso",
        })
        .mockResolvedValueOnce({
          status: 405,
          ok: false,
          location: null,
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          location: null,
        });

      const result = await checkExternalLink("https://portal.example.com/ir", {
        requestFn,
      });

      expect(result).toEqual({ ok: true, status: 200 });
      expect(patchedFetch).not.toHaveBeenCalled();
      expect(mocks.dnsLookup).toHaveBeenCalledTimes(2);
      expect(requestFn).toHaveBeenCalledTimes(3);
      expect(requestFn).toHaveBeenNthCalledWith(
        1,
        "https://portal.example.com/ir",
        "HEAD",
        { address: "93.184.216.34", family: 4 },
      );
      expect(requestFn).toHaveBeenNthCalledWith(
        2,
        "https://cdn.example.com/curso",
        "HEAD",
        { address: "1.1.1.1", family: 4 },
      );
      expect(requestFn).toHaveBeenNthCalledWith(
        3,
        "https://cdn.example.com/curso",
        "GET",
        { address: "1.1.1.1", family: 4 },
      );

      // Tambem confirma que, mesmo sem requestFn injetado, sendCheckedRequest usa https.request pinado e nao globalThis.fetch
      let capturedLookup:
        | ((
            host: string,
            opts: unknown,
            cb: (err: Error | null, address: string, family: number) => void,
          ) => void)
        | undefined;
      const httpsSpy = vi
        .spyOn(https, "request")
        .mockImplementation(((_url: unknown, opts: unknown, cb: unknown) => {
          const req = new EventEmitter() as EventEmitter & {
            end: () => void;
            destroy: () => void;
          };
          const requestOpts = opts as { lookup?: typeof capturedLookup };
          capturedLookup = requestOpts.lookup;
          req.destroy = vi.fn();
          req.end = () => {
            const res = new EventEmitter() as EventEmitter & {
              statusCode: number;
              headers: Record<string, string>;
              resume: () => void;
              destroy: () => void;
            };
            res.statusCode = 200;
            res.headers = {};
            res.resume = vi.fn();
            res.destroy = vi.fn();
            (cb as (response: typeof res) => void)(res);
          };
          return req as never;
        }) as never);

      try {
        const ipLiteralSafety = await isSafeExternalUrl("https://93.184.216.34/ok");
        expect(ipLiteralSafety).toEqual({
          safe: true,
          resolvedAddress: "93.184.216.34",
          resolvedFamily: 4,
        });

        const directResult = await checkExternalLink("https://93.184.216.34/ok");
        expect(directResult).toEqual({ ok: true, status: 200 });
        expect(patchedFetch).not.toHaveBeenCalled();
        expect(httpsSpy).toHaveBeenCalledTimes(1);
        expect(capturedLookup).toBeTypeOf("function");

        await new Promise<void>((resolve) => {
          capturedLookup?.("93.184.216.34", {}, (_err, address, family) => {
            expect(address).toBe("93.184.216.34");
            expect(family).toBe(4);
            resolve();
          });
        });

        const ipv6Safety = await isSafeExternalUrl(
          "https://[2606:4700:4700::1111]/doc",
        );
        expect(ipv6Safety).toEqual({
          safe: true,
          resolvedAddress: "2606:4700:4700::1111",
          resolvedFamily: 6,
        });

        const fallback501Fn = vi
          .fn()
          .mockResolvedValueOnce({ status: 501, ok: false, location: null })
          .mockResolvedValueOnce({ status: 200, ok: true, location: null });
        const result501 = await checkExternalLink("https://93.184.216.34/api", {
          requestFn: fallback501Fn,
        });
        expect(result501).toEqual({ ok: true, status: 200 });
        expect(fallback501Fn).toHaveBeenCalledTimes(2);
        expect(fallback501Fn).toHaveBeenNthCalledWith(
          2,
          "https://93.184.216.34/api",
          "GET",
          { address: "93.184.216.34", family: 4 },
        );
      } finally {
        httpsSpy.mockRestore();
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("DELTA-01: bloqueia faixas IPv6/IPv4 reservadas adicionais e hostnames single-label", () => {
    const blockedIpv6 = [
      "::7f00:1",
      "::ffff:7f00:1",
      "::ffff:127.0.0.1",
      "::ffff:0:7f00:1",
      "64:ff9b::7f00:1",
      "64:ff9b:1::7f00:1",
      "2002:7f00:1::",
      "fec0::1",
      "100::1",
      "2001:db8::1",
      "::127.0.0.1",
      "64:ff9b::127.0.0.1",
      "::ffff:0:127.0.0.1",
    ];
    for (const ip of blockedIpv6) {
      expect(isPrivateOrReservedIp(ip)).toBe(true);
    }

    const blockedIpv4 = [
      "192.0.0.1",
      "192.0.2.1",
      "198.18.0.1",
      "198.51.100.1",
      "203.0.113.1",
    ];
    for (const ip of blockedIpv4) {
      expect(isPrivateOrReservedIp(ip)).toBe(true);
    }

    expect(isPrivateOrReservedIp("2606:4700:4700::1111")).toBe(false);
    expect(validateExternalUrlStructure("https://[2606:4700:4700::1111]/").safe).toBe(true);
    expect(validateExternalUrlStructure("http://db:5432/").safe).toBe(false);
    expect(validateExternalUrlStructure("http://app:3000/").safe).toBe(false);
  });

  it("DELTA-03: endurece CSRF em middleware contra downgrade de esquema, Referer e requisições autenticadas sem cabeçalhos de origem", () => {
    const downgradeReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          "x-forwarded-proto": "https",
          origin: "http://localhost:3000",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(downgradeReq).status).toBe(403);

    const validHttpsOriginReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          "x-forwarded-proto": "https",
          origin: "https://localhost:3000",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(validHttpsOriginReq).status).toBe(200);

    const crossSiteRefererReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          referer: "https://evil.example/ataque",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(crossSiteRefererReq).status).toBe(403);

    const sameHostRefererReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          referer: "http://localhost:3000/app/portfolio",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(sameHostRefererReq).status).toBe(200);

    const missingOriginAuthedReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(missingOriginAuthedReq).status).toBe(403);

    const sameOriginSecFetchReq = new NextRequest(
      "http://localhost:3000/api/portfolio/projects",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          "sec-fetch-site": "same-origin",
          cookie: "authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(sameOriginSecFetchReq).status).toBe(200);

    const forwardedProxyOriginReq = new NextRequest(
      "http://internal:3000/api/portfolio/projects",
      {
        method: "PATCH",
        headers: {
          host: "internal:3000",
          "x-forwarded-host": "app.virachave.com.br, proxy.local",
          "x-forwarded-proto": "HTTPS, http",
          origin: "https://app.virachave.com.br",
          cookie: "__Secure-authjs.session-token=fake-token",
        },
      },
    );
    expect(middleware(forwardedProxyOriginReq).status).toBe(200);

    const unauthCrossSiteReq = new NextRequest(
      "http://localhost:3000/api/auth/callback/credentials",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          "sec-fetch-site": "cross-site",
        },
      },
    );
    expect(middleware(unauthCrossSiteReq).status).toBe(403);

    const unauthClientReq = new NextRequest(
      "http://localhost:3000/api/auth/callback/credentials",
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
        },
      },
    );
    expect(middleware(unauthClientReq).status).toBe(200);
  });
});
