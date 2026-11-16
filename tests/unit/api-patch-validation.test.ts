import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  updatePortfolioProject: vi.fn(),
  deletePortfolioProject: vi.fn(),
  findUniqueClassroom: vi.fn(),
  updateClassroom: vi.fn(),
  getClassroomEducationalView: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireApiRole: mocks.requireApiRole,
  EDUCATOR_PORTAL_ROLES: ["EDUCADOR", "ADMIN"],
  STUDENT_PORTAL_ROLES: ["ESTUDANTE", "ADMIN"],
}));

vi.mock("@/lib/portfolio/portfolio-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/portfolio/portfolio-service")
  >("@/lib/portfolio/portfolio-service");
  return {
    ...actual,
    updatePortfolioProject: mocks.updatePortfolioProject,
    deletePortfolioProject: mocks.deletePortfolioProject,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    classroom: {
      findUnique: mocks.findUniqueClassroom,
      update: mocks.updateClassroom,
    },
  },
}));

vi.mock("@/lib/educator/classroom-analytics", () => ({
  getClassroomEducationalView: mocks.getClassroomEducationalView,
}));

import { PATCH as patchPortfolioProject } from "@/app/api/portfolio/projects/[id]/route";
import {
  GET as getEducatorClassroom,
  PATCH as patchEducatorClassroom,
} from "@/app/api/educator/classrooms/[id]/route";
import {
  MAX_PROJECT_REFLECTION_LENGTH,
  MAX_PROJECT_SUMMARY_LENGTH,
  MAX_PROJECT_TITLE_LENGTH,
} from "@/lib/portfolio/portfolio-service";

function makeJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Etapa 1 AppSec — Validação de Payload e Exceções em PATCH/GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /api/portfolio/projects/[id]", () => {
    beforeEach(() => {
      mocks.requireApiRole.mockResolvedValue({
        userId: "student-1",
        role: Role.ESTUDANTE,
        institutionId: null,
      });
    });

    it.each([null, [], "texto", 123, true, {}])(
      "rejeita payload inválido (%j) com 400 antes de chamar o serviço",
      async (payload) => {
        const res = await patchPortfolioProject(makeJsonRequest(payload), {
          params: Promise.resolve({ id: "proj-1" }),
        });

        expect(res.status).toBe(400);
        expect(mocks.updatePortfolioProject).not.toHaveBeenCalled();
      },
    );

    it("rejeita tipos inválidos (ex.: title numérico) com 400", async () => {
      const res = await patchPortfolioProject(
        makeJsonRequest({ title: 123 }),
        { params: Promise.resolve({ id: "proj-1" }) },
      );

      expect(res.status).toBe(400);
      expect(mocks.updatePortfolioProject).not.toHaveBeenCalled();
    });

    it("rejeita title, summary e reflection acima de maxLength com 400", async () => {
      const longTitle = await patchPortfolioProject(
        makeJsonRequest({ title: "a".repeat(MAX_PROJECT_TITLE_LENGTH + 1) }),
        { params: Promise.resolve({ id: "proj-1" }) },
      );
      const longSummary = await patchPortfolioProject(
        makeJsonRequest({ summary: "a".repeat(MAX_PROJECT_SUMMARY_LENGTH + 1) }),
        { params: Promise.resolve({ id: "proj-1" }) },
      );
      const longReflection = await patchPortfolioProject(
        makeJsonRequest({
          reflection: "a".repeat(MAX_PROJECT_REFLECTION_LENGTH + 1),
        }),
        { params: Promise.resolve({ id: "proj-1" }) },
      );

      expect(longTitle.status).toBe(400);
      expect(longSummary.status).toBe(400);
      expect(longReflection.status).toBe(400);
      expect(mocks.updatePortfolioProject).not.toHaveBeenCalled();
    });
  });

  describe("GET & PATCH /api/educator/classrooms/[id]", () => {
    beforeEach(() => {
      mocks.requireApiRole.mockResolvedValue({
        userId: "educator-1",
        role: Role.EDUCADOR,
        institutionId: "inst-1",
      });
    });

    it.each([null, [], "texto", 42, false, {}])(
      "rejeita payload inválido (%j) com 400 antes de consultar o Prisma",
      async (payload) => {
        const res = await patchEducatorClassroom(makeJsonRequest(payload), {
          params: Promise.resolve({ id: "class-1" }),
        });

        expect(res.status).toBe(400);
        expect(mocks.findUniqueClassroom).not.toHaveBeenCalled();
      },
    );

    it("rejeita tipo inválido em active com 400 antes de consultar o Prisma", async () => {
      const res = await patchEducatorClassroom(
        makeJsonRequest({ active: "true" }),
        { params: Promise.resolve({ id: "class-1" }) },
      );

      expect(res.status).toBe(400);
      expect(mocks.findUniqueClassroom).not.toHaveBeenCalled();
    });

    it("retorna 500 JSON seguro quando GET falha inesperadamente no banco", async () => {
      mocks.getClassroomEducationalView.mockRejectedValue(
        new Error("Prisma connection timeout details"),
      );

      const res = await getEducatorClassroom(
        new Request("http://localhost/api/educator/classrooms/class-1"),
        { params: Promise.resolve({ id: "class-1" }) },
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Não foi possível carregar a turma.");
      expect(JSON.stringify(data)).not.toContain("Prisma");
    });

    it("retorna 500 JSON seguro quando PATCH falha inesperadamente no banco", async () => {
      mocks.findUniqueClassroom.mockRejectedValue(
        new Error("ECONNREFUSED postgres://secret"),
      );

      const res = await patchEducatorClassroom(
        makeJsonRequest({ active: false }),
        { params: Promise.resolve({ id: "class-1" }) },
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Não foi possível atualizar a turma.");
      expect(JSON.stringify(data)).not.toContain("postgres://");
    });
  });
});
