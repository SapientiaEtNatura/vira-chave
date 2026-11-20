import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import type { Session } from "next-auth";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSession: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidateTag: vi.fn(),
  prisma: {
    macroArea: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    discoveryQuestion: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseItem: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
  getSession: mocks.getSession,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return {
    ...actual,
    revalidateTag: mocks.revalidateTag,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

import { checkRoleAccess, requireRole } from "@/lib/rbac";
import { DELETE, PATCH, POST } from "@/app/api/admin/content/route";

function makeSession(name?: string | null): Session {
  return {
    user: {
      id: "user-1",
      name,
      email: "estudante@escola.br",
      role: Role.ESTUDANTE,
      institutionId: "inst-1",
    },
    expires: "2099-01-01T00:00:00.000Z",
  };
}

function makeContentRequest(
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
) {
  return new Request("http://localhost/api/admin/content", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Task 5 — Per-Request Auth Caching & Public Catalog Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.auditLog.create.mockResolvedValue({ id: "audit-1" });
  });

  describe("RBAC user.name propagation and getSession usage", () => {
    it("checkRoleAccess returns user.name from session when present and null when absent", () => {
      const withName = checkRoleAccess(makeSession("Ana Clara"), [
        Role.ESTUDANTE,
      ]);
      expect(withName).toEqual({
        authorized: true,
        user: {
          userId: "user-1",
          name: "Ana Clara",
          role: Role.ESTUDANTE,
          institutionId: "inst-1",
        },
      });

      const withoutName = checkRoleAccess(makeSession(undefined), [
        Role.ESTUDANTE,
      ]);
      expect(withoutName).toEqual({
        authorized: true,
        user: {
          userId: "user-1",
          name: null,
          role: Role.ESTUDANTE,
          institutionId: "inst-1",
        },
      });

      const nullName = checkRoleAccess(makeSession(null), [Role.ESTUDANTE]);
      expect(nullName).toEqual({
        authorized: true,
        user: {
          userId: "user-1",
          name: null,
          role: Role.ESTUDANTE,
          institutionId: "inst-1",
        },
      });
    });

    it("requireRole uses getSession() when exported by @/lib/auth and returns user.name", async () => {
      mocks.getSession.mockResolvedValueOnce(makeSession("Lucas Mendes"));

      const user = await requireRole([Role.ESTUDANTE]);

      expect(mocks.getSession).toHaveBeenCalledTimes(1);
      expect(mocks.auth).not.toHaveBeenCalled();
      expect(user).toEqual({
        userId: "user-1",
        name: "Lucas Mendes",
        role: Role.ESTUDANTE,
        institutionId: "inst-1",
      });
    });
  });

  describe("Public catalog cache helpers (with Vitest transparent fallback)", () => {
    it("getCachedMacroAreas, getCachedDiscoveryQuestions, and getCachedPublishedCourseCount fall back transparently when Next.js incrementalCache is unavailable", async () => {
      const sampleAreas = [
        {
          id: "ma-1",
          name: "Tecnologia e Dados",
          slug: "tecnologia-dados",
          description: "Análise de dados e software.",
          entryRoles: ["Suporte", "Dados"],
        },
      ];
      const sampleQuestions = [
        {
          id: "q-1",
          prompt: "Cenário 1",
          order: 1,
          weightsByArea: { "tecnologia-dados": 3 },
          optionsJson: [],
        },
      ];

      mocks.prisma.macroArea.findMany.mockResolvedValueOnce(sampleAreas);
      mocks.prisma.discoveryQuestion.findMany.mockResolvedValueOnce(
        sampleQuestions,
      );
      mocks.prisma.courseItem.count.mockResolvedValueOnce(12);

      const {
        getCachedMacroAreas,
        getCachedDiscoveryQuestions,
        getCachedPublishedCourseCount,
      } = await import("@/lib/catalog-cache");

      const [areas, questions, courseCount] = await Promise.all([
        getCachedMacroAreas(),
        getCachedDiscoveryQuestions(),
        getCachedPublishedCourseCount(),
      ]);

      expect(areas).toEqual(sampleAreas);
      expect(mocks.prisma.macroArea.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          entryRoles: true,
        },
        orderBy: { name: "asc" },
      });

      expect(questions).toEqual(sampleQuestions);
      expect(mocks.prisma.discoveryQuestion.findMany).toHaveBeenCalledWith({
        orderBy: { order: "asc" },
      });

      expect(courseCount).toBe(12);
      expect(mocks.prisma.courseItem.count).toHaveBeenCalledWith({
        where: { track: { published: true } },
      });
    });

    it("propagates real Prisma errors instead of swallowing or retrying them", async () => {
      const dbError = new Error("DB connection refused");
      mocks.prisma.discoveryQuestion.findMany.mockRejectedValueOnce(dbError);

      const { getCachedDiscoveryQuestions } = await import(
        "@/lib/catalog-cache"
      );

      await expect(getCachedDiscoveryQuestions()).rejects.toThrow(
        "DB connection refused",
      );
      expect(mocks.prisma.discoveryQuestion.findMany).toHaveBeenCalledTimes(
        1,
      );
    });

    it("revalidateCatalogCache invokes revalidateTag('catalog') and safely no-ops outside Next.js request context", async () => {
      const { CATALOG_CACHE_TAG, revalidateCatalogCache } = await import(
        "@/lib/catalog-cache"
      );

      expect(CATALOG_CACHE_TAG).toBe("catalog");

      revalidateCatalogCache();
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(1);
      expect(mocks.revalidateTag).toHaveBeenCalledWith("catalog");

      mocks.revalidateTag.mockImplementationOnce(() => {
        const err = new Error(
          "Invariant: static generation store missing in revalidateTag catalog",
        ) as Error & { __NEXT_ERROR_CODE?: string };
        err.__NEXT_ERROR_CODE = "E263";
        throw err;
      });

      expect(() => revalidateCatalogCache()).not.toThrow();
    });
  });

  describe("POST / PATCH / DELETE /api/admin/content cache invalidation", () => {
    it("calls revalidateCatalogCache() on successful POST, PATCH, and DELETE and skips it on validation failure", async () => {
      mocks.auth.mockResolvedValue({
        user: {
          id: "admin-1",
          name: "Admin Geral",
          role: Role.ADMIN,
          institutionId: null,
        },
      });

      mocks.prisma.macroArea.create.mockResolvedValueOnce({
        id: "ma-new",
        name: "Design",
        slug: "design",
        description: "Design digital.",
        entryRoles: [],
      });
      mocks.prisma.macroArea.update.mockResolvedValueOnce({
        id: "ma-new",
        name: "Design Atualizado",
        slug: "design",
        description: "Design digital.",
        entryRoles: [],
      });
      mocks.prisma.macroArea.delete.mockResolvedValueOnce({ id: "ma-new" });

      const postRes = await POST(
        makeContentRequest("POST", {
          kind: "macroArea",
          name: "Design",
          slug: "design",
          description: "Design digital.",
        }),
      );
      expect(postRes.status).toBe(201);
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(1);
      expect(mocks.revalidateTag).toHaveBeenLastCalledWith("catalog");

      const patchRes = await PATCH(
        makeContentRequest("PATCH", {
          kind: "macroArea",
          id: "ma-new",
          name: "Design Atualizado",
        }),
      );
      expect(patchRes.status).toBe(200);
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(2);
      expect(mocks.revalidateTag).toHaveBeenLastCalledWith("catalog");

      const deleteRes = await DELETE(
        makeContentRequest("DELETE", {
          kind: "macroArea",
          id: "ma-new",
        }),
      );
      expect(deleteRes.status).toBe(200);
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(3);
      expect(mocks.revalidateTag).toHaveBeenLastCalledWith("catalog");

      const invalidRes = await POST(
        makeContentRequest("POST", {
          kind: "macroArea",
          name: "A",
          slug: "INVALID SLUG",
          description: "x",
        }),
      );
      expect(invalidRes.status).toBe(400);
      expect(mocks.revalidateTag).toHaveBeenCalledTimes(3);
    });
  });

  describe("auth.ts callbacks & partial mock fallback compatibility", () => {
    it("requireRole falls back to auth() when @/lib/auth mock omits getSession", async () => {
      vi.resetModules();
      const partialAuthMock = vi.fn().mockResolvedValue(makeSession("Fallback"));
      vi.doMock("@/lib/auth", () => ({
        auth: partialAuthMock,
      }));

      const { requireRole: requireRoleFallback } = await import("@/lib/rbac");
      const user = await requireRoleFallback([Role.ESTUDANTE]);

      expect(partialAuthMock).toHaveBeenCalledTimes(1);
      expect(user).toEqual({
        userId: "user-1",
        name: "Fallback",
        role: Role.ESTUDANTE,
        institutionId: "inst-1",
      });
    });

    it("src/lib/auth.ts selects name in jwt callback, populates session.user.name, and exports cache-wrapped getSession", async () => {
      vi.resetModules();
      vi.doUnmock("@/lib/auth");

      let capturedConfig: {
        callbacks: {
          jwt: (args: {
            token: Record<string, unknown>;
            user?: Record<string, unknown>;
          }) => Promise<Record<string, unknown> | null>;
          session: (args: {
            session: { user: Record<string, unknown> };
            token: Record<string, unknown>;
          }) => Promise<{ user: Record<string, unknown> }>;
        };
      } | null = null;
      const fakeAuth = vi.fn().mockResolvedValue(makeSession("Cached Name"));
      const findUniqueMock = vi.fn().mockResolvedValue({
        name: "Maria Silva",
        status: "ACTIVE",
        tokenVersion: 2,
        role: Role.ESTUDANTE,
        institutionId: "inst-1",
      });

      vi.doMock("next-auth", () => ({
        default: vi.fn((config) => {
          capturedConfig = config;
          return {
            auth: fakeAuth,
            signIn: vi.fn(),
            signOut: vi.fn(),
            handlers: {},
          };
        }),
      }));
      vi.doMock("next-auth/providers/credentials", () => ({
        default: vi.fn(() => ({})),
      }));
      vi.doMock("@/lib/db", () => ({
        prisma: {
          user: {
            findUnique: findUniqueMock,
          },
        },
      }));

      const authModule = await import("@/lib/auth");
      expect(typeof authModule.getSession).toBe("function");
      expect(await authModule.getSession()).toEqual(makeSession("Cached Name"));
      expect(fakeAuth).toHaveBeenCalledTimes(1);

      expect(capturedConfig).not.toBeNull();
      const updatedToken = await capturedConfig!.callbacks.jwt({
        token: { id: "u-1", tokenVersion: 2 },
      });

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: "u-1" },
        select: expect.objectContaining({
          name: true,
          status: true,
          tokenVersion: true,
          role: true,
          institutionId: true,
        }),
      });
      expect(updatedToken).toMatchObject({
        id: "u-1",
        name: "Maria Silva",
        role: Role.ESTUDANTE,
        institutionId: "inst-1",
      });

      const updatedSession = await capturedConfig!.callbacks.session({
        session: { user: { id: "", name: null } },
        token: updatedToken!,
      });
      expect(updatedSession.user.name).toBe("Maria Silva");
    });
  });
});
