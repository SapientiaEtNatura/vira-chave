import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

vi.mock("@/lib/rbac", () => ({
  requireApiRole: vi.fn(),
  STUDENT_PORTAL_ROLES: [Role.ESTUDANTE, Role.ADMIN],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";
import { AUDIT_ACTIONS, recordAuditLog, sanitizeAuditMetadata } from "@/lib/audit";
import { getClassroomEducationalView } from "@/lib/educator/classroom-analytics";
import { POST as changePasswordPost } from "@/app/api/account/password/route";
import { middleware } from "@/middleware";

describe("Fase 3 — Auditoria de Login, Isolamento de Suspensos, Middleware e Troca de Senha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("QA-05: getClassroomEducationalView exclui estudantes SUSPENDED das métricas da turma", async () => {
    const findUniqueClassroom = vi.fn().mockResolvedValue({
      id: "class-1",
      name: "1º Ano A",
      inviteCode: "VC-TEST01",
      active: true,
      educatorId: "educator-1",
      institution: { name: "Escola Teste" },
      enrollments: [
        {
          student: {
            id: "stu-active",
            name: "Estudante Ativo",
            status: "ACTIVE",
            discoveryResults: [{ topAreas: ["tecnologia-dados"] }],
            portfolioProjects: [],
            courseProgress: [],
          },
        },
        {
          student: {
            id: "stu-suspended",
            name: "Estudante Suspenso",
            status: "SUSPENDED",
            discoveryResults: [{ topAreas: ["design-criacao"] }],
            portfolioProjects: [],
            courseProgress: [],
          },
        },
      ],
    });

    const result = await getClassroomEducationalView(
      "class-1",
      "educator-1",
      {
        classroom: { findUnique: findUniqueClassroom },
        macroArea: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ slug: "tecnologia-dados", name: "Tecnologia e Dados" }]),
        },
      } as never,
    );

    expect(result).not.toBeNull();
    expect(result?.totalStudents).toBe(1);
    expect(result?.students.map((s) => s.studentId)).toEqual(["stu-active"]);
  });

  it("SEC-12: recordAuditLog registra AUTH_LOGIN_FAILED sanitizando chaves sensíveis", async () => {
    const sanitized = sanitizeAuditMetadata({
      reason: "invalid_password",
      password: "secret",
      email: "aluno@escola.edu.br",
    }) as Record<string, unknown>;

    expect(sanitized).toEqual({ reason: "invalid_password" });

    await recordAuditLog({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      targetType: "User",
      targetId: "user-1",
      metadata: { reason: "invalid_password", password: "123" },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "AUTH_LOGIN_FAILED",
        targetType: "User",
        targetId: "user-1",
        metadata: { reason: "invalid_password" },
      }),
    });
  });

  it("SEC-01 / QA-04: POST /api/account/password bloqueia nova senha igual à atual e incrementa tokenVersion", async () => {
    vi.mocked(requireApiRole).mockResolvedValue({
      userId: "user-1",
      role: Role.ESTUDANTE,
      institutionId: "inst-1",
    });

    const currentHash = await bcrypt.hash("SenhaAtual123", 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      passwordHash: currentHash,
      status: "ACTIVE",
    } as never);

    // 1. Mesma senha -> 400
    const sameReq = new Request("http://localhost/api/account/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "SenhaAtual123",
        newPassword: "SenhaAtual123",
      }),
    });
    const sameRes = await changePasswordPost(sameReq);
    expect(sameRes.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();

    // 2. Nova senha diferente -> 200 e incrementa tokenVersion
    const diffReq = new Request("http://localhost/api/account/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "SenhaAtual123",
        newPassword: "NovaSenhaForte456",
      }),
    });
    const diffRes = await changePasswordPost(diffReq);
    expect(diffRes.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          tokenVersion: { increment: 1 },
        }),
      }),
    );
  });

  it("SEC-07: middleware bloqueia acesso sem cookie em páginas e APIs protegidas", () => {
    const pageReq = new NextRequest("http://localhost:3000/app/portfolio");
    const pageRes = middleware(pageReq);
    expect(pageRes.status).toBe(307);
    expect(pageRes.headers.get("location")).toContain("/login?callbackUrl=%2Fapp%2Fportfolio");

    const apiReq = new NextRequest("http://localhost:3000/api/portfolio/projects");
    const apiRes = middleware(apiReq);
    expect(apiRes.status).toBe(401);

    const authedReq = new NextRequest("http://localhost:3000/app/portfolio", {
      headers: { cookie: "authjs.session-token=fake-token" },
    });
    const authedRes = middleware(authedReq);
    expect(authedRes.status).toBe(200);
  });
});
