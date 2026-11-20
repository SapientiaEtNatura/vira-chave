import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { ProgressStatus, Role } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  auth: vi.fn(),
  recordAuditLog: vi.fn(),
  checkExternalLink: vi.fn(),
  prisma: {
    discoveryQuestion: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    macroArea: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    discoveryResult: {
      create: vi.fn(),
    },
    track: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    challenge: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    classroom: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    institution: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    portfolioShareLink: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    portfolioProject: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    evidenceFile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/rbac", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rbac")>();
  return {
    ...actual,
    requireApiRole: mocks.requireApiRole,
  };
});

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit")>();
  return {
    ...actual,
    recordAuditLog: mocks.recordAuditLog,
  };
});

vi.mock("@/lib/link-checker", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/link-checker")>();
  return {
    ...actual,
    checkExternalLink: mocks.checkExternalLink,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

import { POST as submitDiscoveryPost } from "@/app/api/discovery/submit/route";
import {
  GET as getAdminContent,
  POST as postAdminContent,
} from "@/app/api/admin/content/route";
import { POST as checkLinksPost } from "@/app/api/admin/content/check-links/route";
import {
  GET as getAdminUsers,
  PATCH as patchAdminUsers,
} from "@/app/api/admin/users/route";
import { GET as getAdminAudit } from "@/app/api/admin/audit/route";
import {
  GET as getAdminClassrooms,
  PATCH as patchAdminClassrooms,
} from "@/app/api/admin/classrooms/route";
import {
  GET as getAdminInstitutions,
  POST as postAdminInstitutions,
  PATCH as patchAdminInstitutions,
} from "@/app/api/admin/institutions/route";
import { POST as changePasswordPost } from "@/app/api/account/password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import {
  GET as getEducatorClassrooms,
  POST as postEducatorClassrooms,
} from "@/app/api/educator/classrooms/route";
import { PATCH as patchEducatorClassroomById } from "@/app/api/educator/classrooms/[id]/route";
import {
  DELETE as deletePortfolioShare,
  GET as getPortfolioShare,
  PATCH as patchPortfolioShare,
  POST as postPortfolioShare,
} from "@/app/api/portfolio/share/route";
import { GET as getPortfolioProjects } from "@/app/api/portfolio/projects/route";
import { GET as getFileRoute } from "@/app/api/files/[fileId]/route";
import {
  completeCourseProgress,
  CourseProgressError,
  startCourseProgress,
} from "@/lib/aprender/progress";
import { hashShareToken, SHARE_TOKEN_COOKIE_NAME } from "@/lib/portfolio/share-token";
import { MAX_STUDENT_EVIDENCE_FILES } from "@/lib/storage/local-files";
import { loginSchema, resetConfirmSchema } from "@/lib/validations/auth";

function jsonReq(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function assertSanitized500(status: number, data: unknown) {
  expect(status).toBe(500);
  expect(data).toEqual({ error: expect.any(String) });
  const serialized = JSON.stringify(data);
  expect(serialized).not.toContain("postgres://");
  expect(serialized).not.toContain("ECONNREFUSED");
  expect(serialized).not.toContain("Prisma");
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Task 3 — Security Delta APIs, File Streaming & Sliding Worker Pool", () => {
  const tempDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recordAuditLog.mockResolvedValue(undefined);
    mocks.requireApiRole.mockResolvedValue({
      userId: "user-1",
      role: Role.ADMIN,
      institutionId: "inst-1",
    });
  });

  afterEach(async () => {
    delete process.env.UPLOAD_DIR;
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  describe("DELTA-06 — Limites de entrada em discovery, admin/content, auth e account/password", () => {
    it("rejeita >50 keys em answers, >20 keys em selfPractice ou valor >64 chars com 400 sem consultar o Prisma", async () => {
      mocks.requireApiRole.mockResolvedValue({
        userId: "student-1",
        role: Role.ESTUDANTE,
        institutionId: "inst-1",
      });

      const tooManyAnswers = Object.fromEntries(
        Array.from({ length: 51 }, (_, i) => [`q-${i}`, "opt-a"]),
      );
      const resTooManyAnswers = await submitDiscoveryPost(
        jsonReq("http://localhost/api/discovery/submit", "POST", {
          answers: tooManyAnswers,
          selfPractice: { "tecnologia-dados": 1 },
        }),
      );
      expect(resTooManyAnswers.status).toBe(400);

      const tooManyAreas = Object.fromEntries(
        Array.from({ length: 21 }, (_, i) => [`area-${i}`, 1]),
      );
      const resTooManyAreas = await submitDiscoveryPost(
        jsonReq("http://localhost/api/discovery/submit", "POST", {
          answers: { "q-1": "opt-a" },
          selfPractice: tooManyAreas,
        }),
      );
      expect(resTooManyAreas.status).toBe(400);

      const resLongAnswerValue = await submitDiscoveryPost(
        jsonReq("http://localhost/api/discovery/submit", "POST", {
          answers: { "q-1": "x".repeat(65) },
          selfPractice: { "tecnologia-dados": 1 },
        }),
      );
      expect(resLongAnswerValue.status).toBe(400);

      const resLongAnswerKey = await submitDiscoveryPost(
        jsonReq("http://localhost/api/discovery/submit", "POST", {
          answers: { ["k".repeat(65)]: "opt-a" },
          selfPractice: { "tecnologia-dados": 1 },
        }),
      );
      expect(resLongAnswerKey.status).toBe(400);

      expect(mocks.prisma.discoveryQuestion.findMany).not.toHaveBeenCalled();
    });

    it("rejeita limites excedidos em admin/content (option.id >64, weightsByArea >30 keys, externalUrl >2048)", async () => {
      const longOptionIdRes = await postAdminContent(
        jsonReq("http://localhost/api/admin/content", "POST", {
          kind: "question",
          prompt: "Pergunta situacional de teste válido",
          order: 1,
          options: [
            {
              id: "o".repeat(65),
              label: "Primeira opção válida para o cenário.",
              weightsByArea: { "tecnologia-dados": 3 },
            },
            {
              id: "b",
              label: "Segunda opção válida para o cenário.",
              weightsByArea: { "design-criacao": 2 },
            },
          ],
        }),
      );
      expect(longOptionIdRes.status).toBe(400);

      const tooManyWeights = Object.fromEntries(
        Array.from({ length: 31 }, (_, i) => [`area-${i}`, 1]),
      );
      const manyWeightsRes = await postAdminContent(
        jsonReq("http://localhost/api/admin/content", "POST", {
          kind: "question",
          prompt: "Pergunta situacional de teste válido",
          order: 1,
          options: [
            {
              id: "a",
              label: "Primeira opção válida para o cenário.",
              weightsByArea: tooManyWeights,
            },
            {
              id: "b",
              label: "Segunda opção válida para o cenário.",
              weightsByArea: { "design-criacao": 2 },
            },
          ],
        }),
      );
      expect(manyWeightsRes.status).toBe(400);

      const longUrl = `https://example.com/${"a".repeat(2040)}`;
      const longUrlRes = await postAdminContent(
        jsonReq("http://localhost/api/admin/content", "POST", {
          kind: "courseItem",
          trackId: "track-1",
          title: "Curso com URL gigante",
          providerName: "Provedor",
          externalUrl: longUrl,
          order: 1,
        }),
      );
      expect(longUrlRes.status).toBe(400);
      expect(mocks.prisma.discoveryQuestion.create).not.toHaveBeenCalled();
      expect(mocks.prisma.courseItem.create).not.toHaveBeenCalled();
    });

    it("limita loginSchema.password (.max(128)), resetConfirmSchema.token (.max(256)) e currentPassword (.max(128))", async () => {
      expect(
        loginSchema.safeParse({
          email: "user@example.com",
          password: "p".repeat(129),
        }).success,
      ).toBe(false);

      expect(
        resetConfirmSchema.safeParse({
          token: "t".repeat(257),
          newPassword: "NovaSenhaForte123",
        }).success,
      ).toBe(false);

      const res = await changePasswordPost(
        jsonReq("http://localhost/api/account/password", "POST", {
          currentPassword: "p".repeat(129),
          newPassword: "NovaSenhaForte123",
        }),
      );
      expect(res.status).toBe(400);
      expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("DELTA-07 — Paginação limitada e respostas 500 JSON sanitizadas", () => {
    it("admin/users e admin/audit rejeitam ?page=999999999999 com 400", async () => {
      const usersRes = await getAdminUsers(
        new Request("http://localhost/api/admin/users?page=999999999999"),
      );
      expect(usersRes.status).toBe(400);
      expect(mocks.prisma.user.findMany).not.toHaveBeenCalled();

      const auditRes = await getAdminAudit(
        new Request("http://localhost/api/admin/audit?page=999999999999"),
      );
      expect(auditRes.status).toBe(400);
      expect(mocks.prisma.auditLog.findMany).not.toHaveBeenCalled();
    });

    it("retorna 500 JSON sanitizado quando falhas de banco ocorrem nas rotas protegidas", async () => {
      const dbError = new Error(
        "ECONNREFUSED postgres://admin:supersecret@db.internal:5432/virachave Prisma",
      );

      mocks.prisma.discoveryQuestion.findMany.mockRejectedValueOnce(dbError);
      const discoveryRes = await submitDiscoveryPost(
        jsonReq("http://localhost/api/discovery/submit", "POST", {
          answers: { "q-1": "opt-a" },
          selfPractice: { "tecnologia-dados": 1 },
        }),
      );
      assertSanitized500(discoveryRes.status, await discoveryRes.json());

      mocks.prisma.user.findUnique.mockRejectedValueOnce(dbError);
      const passwordRes = await changePasswordPost(
        jsonReq("http://localhost/api/account/password", "POST", {
          currentPassword: "SenhaAtual123",
          newPassword: "NovaSenhaForte456",
        }),
      );
      assertSanitized500(passwordRes.status, await passwordRes.json());

      mocks.prisma.passwordResetToken.findUnique.mockRejectedValueOnce(dbError);
      const resetConfirmRes = await resetPasswordPost(
        jsonReq("http://localhost/api/auth/reset-password", "POST", {
          token: "a".repeat(32),
          newPassword: "NovaSenhaForte456",
        }),
      );
      assertSanitized500(resetConfirmRes.status, await resetConfirmRes.json());

      mocks.prisma.user.findUnique.mockRejectedValueOnce(dbError);
      const resetReqRes = await resetPasswordPost(
        jsonReq("http://localhost/api/auth/reset-password", "POST", {
          email: "aluno@example.com",
        }),
      );
      assertSanitized500(resetReqRes.status, await resetReqRes.json());

      mocks.prisma.classroom.findMany.mockRejectedValueOnce(dbError);
      const eduGetRes = await getEducatorClassrooms();
      assertSanitized500(eduGetRes.status, await eduGetRes.json());

      mocks.prisma.user.findUnique.mockRejectedValueOnce(dbError);
      const eduPostRes = await postEducatorClassrooms(
        jsonReq("http://localhost/api/educator/classrooms", "POST", {
          name: "Turma 1A",
        }),
      );
      assertSanitized500(eduPostRes.status, await eduPostRes.json());

      mocks.prisma.classroom.findMany.mockRejectedValueOnce(dbError);
      const adminClassGetRes = await getAdminClassrooms(
        new Request("http://localhost/api/admin/classrooms"),
      );
      assertSanitized500(
        adminClassGetRes.status,
        await adminClassGetRes.json(),
      );

      mocks.prisma.classroom.update.mockRejectedValueOnce(dbError);
      const adminClassPatchRes = await patchAdminClassrooms(
        jsonReq("http://localhost/api/admin/classrooms", "PATCH", {
          classroomId: "class-1",
          active: false,
        }),
      );
      assertSanitized500(
        adminClassPatchRes.status,
        await adminClassPatchRes.json(),
      );

      mocks.prisma.institution.findMany.mockRejectedValueOnce(dbError);
      const adminInstGetRes = await getAdminInstitutions();
      assertSanitized500(adminInstGetRes.status, await adminInstGetRes.json());

      mocks.prisma.institution.create.mockRejectedValueOnce(dbError);
      const adminInstPostRes = await postAdminInstitutions(
        jsonReq("http://localhost/api/admin/institutions", "POST", {
          name: "Escola Teste",
        }),
      );
      assertSanitized500(
        adminInstPostRes.status,
        await adminInstPostRes.json(),
      );

      mocks.prisma.institution.update.mockRejectedValueOnce(dbError);
      const adminInstPatchRes = await patchAdminInstitutions(
        jsonReq("http://localhost/api/admin/institutions", "PATCH", {
          kind: "institution",
          id: "inst-1",
          active: false,
        }),
      );
      assertSanitized500(
        adminInstPatchRes.status,
        await adminInstPatchRes.json(),
      );

      mocks.prisma.user.count.mockRejectedValueOnce(dbError);
      mocks.prisma.user.findMany.mockResolvedValueOnce([]);
      const adminUsersGetRes = await getAdminUsers(
        new Request("http://localhost/api/admin/users"),
      );
      assertSanitized500(
        adminUsersGetRes.status,
        await adminUsersGetRes.json(),
      );

      mocks.prisma.user.findUnique.mockRejectedValueOnce(dbError);
      const adminUsersPatchRes = await patchAdminUsers(
        jsonReq("http://localhost/api/admin/users", "PATCH", {
          userId: "u-2",
          status: "SUSPENDED",
        }),
      );
      assertSanitized500(
        adminUsersPatchRes.status,
        await adminUsersPatchRes.json(),
      );

      mocks.prisma.auditLog.count.mockRejectedValueOnce(dbError);
      mocks.prisma.auditLog.findMany.mockResolvedValueOnce([]);
      const adminAuditGetRes = await getAdminAudit(
        new Request("http://localhost/api/admin/audit"),
      );
      assertSanitized500(
        adminAuditGetRes.status,
        await adminAuditGetRes.json(),
      );

      mocks.prisma.macroArea.findMany.mockRejectedValueOnce(dbError);
      const adminContentGetRes = await getAdminContent();
      assertSanitized500(
        adminContentGetRes.status,
        await adminContentGetRes.json(),
      );

      mocks.prisma.courseItem.findMany.mockRejectedValueOnce(dbError);
      const checkLinksRes = await checkLinksPost(
        new Request("http://localhost/api/admin/content/check-links", {
          method: "POST",
        }),
      );
      assertSanitized500(checkLinksRes.status, await checkLinksRes.json());

      mocks.prisma.portfolioShareLink.findFirst.mockRejectedValueOnce(dbError);
      const shareGetRes = await getPortfolioShare();
      assertSanitized500(shareGetRes.status, await shareGetRes.json());

      mocks.prisma.$transaction.mockRejectedValueOnce(dbError);
      const sharePostRes = await postPortfolioShare(
        new Request("http://localhost/api/portfolio/share", { method: "POST" }),
      );
      assertSanitized500(sharePostRes.status, await sharePostRes.json());

      mocks.prisma.portfolioShareLink.updateMany.mockRejectedValueOnce(dbError);
      const sharePatchRes = await patchPortfolioShare(
        jsonReq("http://localhost/api/portfolio/share", "PATCH", {
          includeReadiness: true,
        }),
      );
      assertSanitized500(sharePatchRes.status, await sharePatchRes.json());

      mocks.prisma.portfolioShareLink.updateMany.mockRejectedValueOnce(dbError);
      const shareDeleteRes = await deletePortfolioShare();
      assertSanitized500(shareDeleteRes.status, await shareDeleteRes.json());

      mocks.prisma.portfolioProject.findMany.mockRejectedValueOnce(dbError);
      const projectsGetRes = await getPortfolioProjects();
      assertSanitized500(projectsGetRes.status, await projectsGetRes.json());
    });
  });

  describe("DELTA-09 & PERF-12 — GET /api/files/[fileId] via cookie exclusivo e streaming", () => {
    it("ignora ?shareToken= na URL retornando 401 sem cookie e faz streaming com Content-Length quando cookie é válido", async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "virachave-stream-"));
      tempDirs.push(tmpDir);
      process.env.UPLOAD_DIR = tmpDir;

      const ownerDir = path.join(tmpDir, "student-owner");
      await mkdir(ownerDir, { recursive: true });
      const pdfBytes = Buffer.from("%PDF-1.4\n%stream-content-12345");
      await writeFile(path.join(ownerDir, "cert.pdf"), pdfBytes);

      const rawToken = "ValidShareCookieToken_123456";
      const tokenHash = hashShareToken(rawToken);

      mocks.auth.mockResolvedValue(null);
      mocks.prisma.evidenceFile.findUnique.mockResolvedValue({
        id: "file-1",
        storageKey: "student-owner/cert.pdf",
        originalName: "meu-certificado.pdf",
        mimeType: "application/pdf",
        sizeBytes: pdfBytes.length,
        project: {
          studentId: "student-owner",
          isIncludedInShare: true,
        },
      });
      mocks.prisma.portfolioShareLink.findUnique.mockResolvedValue({
        studentId: "student-owner",
        active: true,
        revokedAt: null,
        student: { status: "ACTIVE" },
      });

      // 1. ?shareToken na query sem cookie -> 401 (DELTA-09)
      const queryOnlyReq = new Request(
        `http://localhost/api/files/file-1?shareToken=${rawToken}`,
      );
      const queryOnlyRes = await getFileRoute(queryOnlyReq, {
        params: Promise.resolve({ fileId: "file-1" }),
      });
      expect(queryOnlyRes.status).toBe(401);

      // 2. Cookie __vc_share_token válido -> 200 streaming + headers corretos (PERF-12)
      const cookieReq = new Request("http://localhost/api/files/file-1", {
        headers: {
          cookie: `${SHARE_TOKEN_COOKIE_NAME}=${rawToken}`,
        },
      });
      const cookieRes = await getFileRoute(cookieReq, {
        params: Promise.resolve({ fileId: "file-1" }),
      });

      expect(cookieRes.status).toBe(200);
      expect(cookieRes.headers.get("Content-Length")).toBe(
        String(pdfBytes.length),
      );
      expect(cookieRes.headers.get("Content-Disposition")).toBe(
        'attachment; filename="meu-certificado.pdf"',
      );
      expect(cookieRes.headers.get("Content-Security-Policy")).toBe("sandbox");
      expect(cookieRes.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(cookieRes.headers.get("Cache-Control")).toBe("private, no-store");
      expect(mocks.prisma.portfolioShareLink.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash },
        }),
      );

      const streamed = Buffer.from(await cookieRes.arrayBuffer());
      expect(streamed.equals(pdfBytes)).toBe(true);

      // 3. Arquivo ausente no disco (ENOENT) -> 404
      mocks.prisma.evidenceFile.findUnique.mockResolvedValueOnce({
        id: "file-missing",
        storageKey: "student-owner/nao-existe.pdf",
        originalName: "nao-existe.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        project: {
          studentId: "student-owner",
          isIncludedInShare: true,
        },
      });
      const missingRes = await getFileRoute(
        new Request("http://localhost/api/files/file-missing", {
          headers: { cookie: `${SHARE_TOKEN_COOKIE_NAME}=${rawToken}` },
        }),
        { params: Promise.resolve({ fileId: "file-missing" }) },
      );
      expect(missingRes.status).toBe(404);

      // 4. Erro não-ENOENT (falha no banco / storageKey inválido) -> 500 JSON sanitizado
      mocks.prisma.evidenceFile.findUnique.mockRejectedValueOnce(
        new Error("ECONNREFUSED postgres://secret"),
      );
      const dbErrRes = await getFileRoute(cookieReq, {
        params: Promise.resolve({ fileId: "file-1" }),
      });
      assertSanitized500(dbErrRes.status, await dbErrRes.json());

      mocks.prisma.evidenceFile.findUnique.mockResolvedValueOnce({
        id: "file-bad-key",
        storageKey: "../escape.pdf",
        originalName: "escape.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10,
        project: {
          studentId: "student-owner",
          isIncludedInShare: true,
        },
      });
      const badKeyRes = await getFileRoute(
        new Request("http://localhost/api/files/file-bad-key", {
          headers: { cookie: `${SHARE_TOKEN_COOKIE_NAME}=${rawToken}` },
        }),
        { params: Promise.resolve({ fileId: "file-bad-key" }) },
      );
      assertSanitized500(badKeyRes.status, await badKeyRes.json());
    });
  });

  describe("DELTA-10 — Filtro de alunos ACTIVE em educator/classrooms e reset-password", () => {
    it("educator/classrooms filtra _count.select.enrollments com student: { status: 'ACTIVE' }", async () => {
      mocks.requireApiRole.mockResolvedValue({
        userId: "educator-1",
        role: Role.EDUCADOR,
        institutionId: "inst-1",
      });

      mocks.prisma.classroom.findMany.mockResolvedValueOnce([]);
      const getRes = await getEducatorClassrooms();
      expect(getRes.status).toBe(200);
      expect(mocks.prisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            _count: {
              select: {
                enrollments: {
                  where: { student: { status: "ACTIVE" } },
                },
              },
            },
          }),
        }),
      );

      mocks.prisma.user.findUnique.mockResolvedValueOnce({
        institutionId: "inst-1",
        institution: { active: true },
      });
      mocks.prisma.classroom.create.mockResolvedValueOnce({
        id: "class-new",
        name: "Turma Ativa",
        inviteCode: "VC-123456",
        active: true,
        createdAt: new Date("2026-11-20T10:00:00Z"),
        institution: { name: "Escola Modelo" },
        _count: { enrollments: 0 },
      });
      const postRes = await postEducatorClassrooms(
        jsonReq("http://localhost/api/educator/classrooms", "POST", {
          name: "Turma Ativa",
        }),
      );
      expect(postRes.status).toBe(201);
      expect(mocks.prisma.classroom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            _count: {
              select: {
                enrollments: {
                  where: { student: { status: "ACTIVE" } },
                },
              },
            },
          }),
        }),
      );

      mocks.prisma.classroom.findUnique.mockResolvedValueOnce({
        id: "class-1",
        educatorId: "educator-1",
      });
      mocks.prisma.classroom.update.mockResolvedValueOnce({
        id: "class-1",
        name: "Turma Renomeada",
        inviteCode: "VC-123456",
        active: true,
        createdAt: new Date("2026-11-20T10:00:00Z"),
        institution: { name: "Escola Modelo" },
        _count: { enrollments: 2 },
      });
      const patchRes = await patchEducatorClassroomById(
        jsonReq("http://localhost/api/educator/classrooms/class-1", "PATCH", {
          name: "Turma Renomeada",
        }),
        { params: Promise.resolve({ id: "class-1" }) },
      );
      expect(patchRes.status).toBe(200);
      expect(mocks.prisma.classroom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            _count: {
              select: {
                enrollments: {
                  where: { student: { status: "ACTIVE" } },
                },
              },
            },
          }),
        }),
      );
    });

    it("reset-password confirm retorna 400 quando user.status === 'SUSPENDED' sem chamar $transaction", async () => {
      mocks.prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: "tok-1",
        userId: "stu-suspended",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        user: { status: "SUSPENDED" },
      });

      const bcryptSpy = vi.spyOn(bcrypt, "hash");

      const res = await resetPasswordPost(
        jsonReq("http://localhost/api/auth/reset-password", "POST", {
          token: "valid-reset-token-1234567890",
          newPassword: "NovaSenhaForte456",
        }),
      );

      expect(res.status).toBe(400);
      expect(mocks.prisma.passwordResetToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            user: { select: { status: true } },
          }),
        }),
      );
      expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
      expect(bcryptSpy).not.toHaveBeenCalled();
      bcryptSpy.mockRestore();
    });
  });

  describe("PERF-13 & quota — startCourseProgress paralelo e substituição de certificado em 50/50", () => {
    it("startCourseProgress executa courseItem.findFirst e courseProgress.findUnique em paralelo", async () => {
      const courseDeferred = createDeferred<{ id: string } | null>();
      const progressDeferred = createDeferred<{
        id: string;
        status: ProgressStatus;
      } | null>();

      const courseFindFirst = vi.fn().mockReturnValue(courseDeferred.promise);
      const progressFindUnique = vi.fn().mockReturnValue(progressDeferred.promise);
      const progressUpsert = vi.fn().mockResolvedValue({
        id: "prog-1",
        status: ProgressStatus.EM_ANDAMENTO,
        startedAt: new Date(),
      });

      const runPromise = startCourseProgress(
        { studentId: "student-1", courseItemId: "course-1" },
        {
          courseItem: { findFirst: courseFindFirst },
          courseProgress: {
            findUnique: progressFindUnique,
            upsert: progressUpsert,
          },
        } as never,
      );

      // Antes de qualquer promise resolver, ambas já devem ter sido disparadas
      expect(courseFindFirst).toHaveBeenCalledTimes(1);
      expect(progressFindUnique).toHaveBeenCalledTimes(1);

      courseDeferred.resolve({ id: "course-1" });
      progressDeferred.resolve(null);

      const res = await runPromise;
      expect(res.status).toBe(ProgressStatus.EM_ANDAMENTO);
      expect(progressUpsert).toHaveBeenCalledTimes(1);
    });

    it("completeCourseProgress permite substituir certificado existente com 50/50 arquivos e bloqueia novo arquivo sem certificado prévio", async () => {
      const saveFile = vi.fn().mockResolvedValue({
        storageKey: "student-1/new-cert.pdf",
        originalName: "novo-cert.pdf",
        mimeType: "application/pdf",
        sizeBytes: 128,
      });
      const deleteFile = vi.fn().mockResolvedValue(undefined);
      const projectDelete = vi.fn().mockResolvedValue({ id: "proj-old" });
      const projectCreate = vi.fn().mockResolvedValue({ id: "proj-new" });
      const evidenceCreate = vi.fn().mockResolvedValue({ id: "ev-new" });
      const progressUpsert = vi.fn().mockResolvedValue({
        id: "prog-1",
        status: ProgressStatus.CONCLUIDO,
        certificateFileId: "ev-new",
      });

      const tx = {
        courseProgress: {
          findUnique: vi.fn().mockResolvedValue({
            id: "prog-1",
            studentId: "student-1",
            courseItemId: "course-1",
            status: ProgressStatus.CONCLUIDO,
            certificateFileId: "ev-old",
            startedAt: new Date("2026-11-01T00:00:00Z"),
          }),
          upsert: progressUpsert,
        },
        evidenceFile: {
          findUnique: vi.fn().mockResolvedValue({
            id: "ev-old",
            storageKey: "student-1/old-cert.pdf",
            projectId: "proj-old",
          }),
          create: evidenceCreate,
        },
        portfolioProject: {
          delete: projectDelete,
          create: projectCreate,
        },
      };

      const prismaMock = {
        courseItem: {
          findFirst: vi.fn().mockResolvedValue({
            id: "course-1",
            title: "Curso 1",
            providerName: "Provedor",
            externalUrl: "https://example.com/curso",
            track: { id: "track-1", title: "Trilha 1", published: true },
          }),
        },
        courseProgress: {
          findUnique: vi.fn().mockResolvedValue({
            id: "prog-1",
            certificateFileId: "ev-old",
          }),
        },
        evidenceFile: {
          count: vi.fn().mockResolvedValue(MAX_STUDENT_EVIDENCE_FILES),
        },
        $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) =>
          cb(tx),
        ),
      };

      const certFile = new File([Buffer.from("%PDF-1.4\nnew")], "novo.pdf", {
        type: "application/pdf",
      });

      const replaced = await completeCourseProgress(
        {
          studentId: "student-1",
          courseItemId: "course-1",
          notes: "Atualizei meu certificado do curso.",
          file: certFile,
        },
        {
          prismaClient: prismaMock as never,
          saveFile,
          deleteFile,
        },
      );

      expect(replaced.certificateFileId).toBe("ev-new");
      expect(projectDelete).toHaveBeenCalledWith({ where: { id: "proj-old" } });
      expect(deleteFile).toHaveBeenCalledWith("student-1/old-cert.pdf");

      // Sem certificado prévio no curso, 50/50 continua bloqueado
      prismaMock.courseProgress.findUnique.mockResolvedValueOnce(null);
      await expect(
        completeCourseProgress(
          {
            studentId: "student-1",
            courseItemId: "course-2",
            notes: "Tentativa acima da cota.",
            file: certFile,
          },
          {
            prismaClient: prismaMock as never,
            saveFile,
            deleteFile,
          },
        ),
      ).rejects.toThrow(CourseProgressError);
    });
  });

  describe("PERF-14 — Sliding 5-worker pool e único $transaction em check-links", () => {
    it("processa pool deslizante de 5 workers sem travar na onda e persiste tudo em um único $transaction", async () => {
      const courses = Array.from({ length: 7 }, (_, i) => ({
        id: `course-${i}`,
        title: `Curso ${i}`,
        externalUrl: `https://example.com/${i}`,
      }));

      mocks.prisma.courseItem.findMany.mockResolvedValueOnce(courses);
      mocks.prisma.courseItem.update.mockImplementation(
        (args: unknown) => args,
      );
      mocks.prisma.$transaction.mockImplementation(async (ops: unknown[]) => ops);

      const slowFirst = createDeferred<{ ok: boolean; status: number | null }>();
      const startedUrls: string[] = [];

      mocks.checkExternalLink.mockImplementation(async (url: string) => {
        startedUrls.push(url);
        if (url === "https://example.com/0") {
          return slowFirst.promise;
        }
        return { ok: true, status: 200 };
      });

      const responsePromise = checkLinksPost(
        new Request("http://localhost/api/admin/content/check-links", {
          method: "POST",
        }),
      );

      // Aguarda os workers rápidos processarem os cursos 1..6 enquanto o curso 0 ainda está pendente
      await vi.waitFor(() => {
        expect(startedUrls).toContain("https://example.com/5");
        expect(startedUrls).toContain("https://example.com/6");
      });

      // Mesmo com curso 0 lento, os 7 cursos foram iniciados sem esperar o término do curso 0 (sem wave stall)
      expect(startedUrls).toHaveLength(7);
      expect(mocks.prisma.$transaction).not.toHaveBeenCalled();

      slowFirst.resolve({ ok: false, status: 404 });

      const response = await responsePromise;
      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        checkedCount: number;
        okCount: number;
        brokenCount: number;
        results: Array<{ id: string; lastCheckOk: boolean; lastCheckStatus: number | null }>;
      };

      expect(payload.checkedCount).toBe(7);
      expect(payload.okCount).toBe(6);
      expect(payload.brokenCount).toBe(1);
      expect(payload.results.map((r) => r.id)).toEqual(
        courses.map((c) => c.id),
      );
      expect(payload.results[0]).toMatchObject({
        id: "course-0",
        lastCheckOk: false,
        lastCheckStatus: 404,
      });

      expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
      const txArg = mocks.prisma.$transaction.mock.calls[0]?.[0] as unknown[];
      expect(Array.isArray(txArg)).toBe(true);
      expect(txArg).toHaveLength(7);
    });

    it("não chama $transaction quando não há cursos para verificar", async () => {
      mocks.prisma.courseItem.findMany.mockResolvedValueOnce([]);

      const response = await checkLinksPost(
        new Request("http://localhost/api/admin/content/check-links", {
          method: "POST",
        }),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        checkedCount: 0,
        okCount: 0,
        brokenCount: 0,
        results: [],
      });
      expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
