import { describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import type { Session } from "next-auth";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { isPrivateOrReservedIp, isSafeExternalUrl } from "@/lib/link-checker";
import { sanitizeAuditMetadata } from "@/lib/audit";
import {
  EDUCATOR_PORTAL_ROLES,
  STUDENT_PORTAL_ROLES,
  checkRoleAccess,
  getHomeRouteForRole,
} from "@/lib/rbac";

function makeSession(role: Role, id = "user-1"): Session {
  return {
    user: {
      id,
      name: "Usuário Teste",
      email: "teste@example.com",
      role,
      institutionId: null,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

describe("Helpers do Painel Admin", () => {
  describe("link-checker (proteção SSRF)", () => {
    it.each([
      "127.0.0.1",
      "10.0.0.1",
      "172.16.0.5",
      "192.168.1.1",
      "169.254.169.254",
      "::1",
      "fc00::1",
      "fe80::1",
    ])("bloqueia IP privado ou reservado: %s", (ip) => {
      expect(isPrivateOrReservedIp(ip)).toBe(true);
    });

    it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111"])(
      "permite IP público IPv4/IPv6: %s",
      (ip) => {
        expect(isPrivateOrReservedIp(ip)).toBe(false);
      },
    );

    it.each([
      "http://localhost:3000",
      "ftp://example.com",
      "https://user:pass@example.com",
      "http://169.254.169.254/latest/meta-data",
      "https://intranet.local",
    ])("bloqueia URL externa insegura: %s", async (url) => {
      const result = await isSafeExternalUrl(url);
      expect(result.safe).toBe(false);
      expect(result.reason).toBeTruthy();
    });
  });

  describe("audit (sanitizeAuditMetadata)", () => {
    it("remove chaves sensíveis inclusive em objetos aninhados e preserva campos seguros", () => {
      const sanitized = sanitizeAuditMetadata({
        changedFields: ["name", "status"],
        newStatus: "ACTIVE",
        checkedCount: 12,
        password: "plain-password",
        passwordHash: "$2b$10$hash",
        token: "jwt-token",
        email: "estudante@example.com",
        answers: [{ q: 1, a: "A" }],
        reflection: "Texto pessoal do estudante",
        secret: "top-secret",
        nested: {
          password: "nested-password",
          passwordHash: "nested-hash",
          token: "nested-token",
          email: "nested@example.com",
          answers: ["x"],
          reflection: "reflexão aninhada",
          secret: "nested-secret",
          safeNestedFlag: true,
        },
      });

      expect(sanitized).toEqual({
        changedFields: ["name", "status"],
        newStatus: "ACTIVE",
        checkedCount: 12,
        nested: {
          safeNestedFlag: true,
        },
      });
    });

    it("retorna undefined quando metadata é null ou undefined", () => {
      expect(sanitizeAuditMetadata(null)).toBeUndefined();
      expect(sanitizeAuditMetadata(undefined)).toBeUndefined();
    });
  });

  describe("rbac (portais de preview e rota inicial do ADMIN)", () => {
    it("retorna /admin para getHomeRouteForRole(Role.ADMIN)", () => {
      expect(getHomeRouteForRole(Role.ADMIN)).toBe("/admin");
    });

    it("inclui Role.ADMIN nos portais de estudante e educador sem quebrar checkRoleAccess", () => {
      expect(STUDENT_PORTAL_ROLES).toContain(Role.ESTUDANTE);
      expect(STUDENT_PORTAL_ROLES).toContain(Role.ADMIN);
      expect(STUDENT_PORTAL_ROLES).not.toContain(Role.EDUCADOR);

      expect(EDUCATOR_PORTAL_ROLES).toContain(Role.EDUCADOR);
      expect(EDUCATOR_PORTAL_ROLES).toContain(Role.ADMIN);
      expect(EDUCATOR_PORTAL_ROLES).not.toContain(Role.ESTUDANTE);

      const adminSession = makeSession(Role.ADMIN, "admin-1");
      expect(checkRoleAccess(adminSession, STUDENT_PORTAL_ROLES)).toEqual({
        authorized: true,
        user: {
          userId: "admin-1",
          name: "Usuário Teste",
          role: Role.ADMIN,
          institutionId: null,
        },
      });
      expect(checkRoleAccess(adminSession, EDUCATOR_PORTAL_ROLES)).toEqual({
        authorized: true,
        user: {
          userId: "admin-1",
          name: "Usuário Teste",
          role: Role.ADMIN,
          institutionId: null,
        },
      });

      const studentSession = makeSession(Role.ESTUDANTE, "student-1");
      expect(checkRoleAccess(studentSession, EDUCATOR_PORTAL_ROLES)).toMatchObject({
        authorized: false,
        status: 403,
      });

      const educatorSession = makeSession(Role.EDUCADOR, "educator-1");
      expect(checkRoleAccess(educatorSession, STUDENT_PORTAL_ROLES)).toMatchObject({
        authorized: false,
        status: 403,
      });

      expect(checkRoleAccess(null, STUDENT_PORTAL_ROLES)).toMatchObject({
        authorized: false,
        status: 401,
      });
    });
  });
});
