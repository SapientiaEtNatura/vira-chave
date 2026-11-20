import { describe, expect, it, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

vi.mock("@/lib/rbac", () => ({
  requireApiRole: vi.fn(),
  STUDENT_PORTAL_ROLES: [Role.ESTUDANTE, Role.ADMIN],
  EDUCATOR_PORTAL_ROLES: [Role.EDUCADOR, Role.ADMIN],
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/files/authorize-file", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/files/authorize-file")>();
  return {
    ...actual,
    authorizeFileAccess: vi.fn(),
  };
});

vi.mock("@/lib/storage/local-files", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/storage/local-files")>();
  return {
    ...actual,
    openStoredFileStream: vi.fn(),
  };
});

import { requireApiRole } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { authorizeFileAccess } from "@/lib/files/authorize-file";
import { openStoredFileStream } from "@/lib/storage/local-files";
import { SHARE_TOKEN_COOKIE_NAME } from "@/lib/portfolio/share-token";
import { getSharedPortfolioByToken } from "@/lib/portfolio/portfolio-service";
import { POST as createPortfolioPost } from "@/app/api/portfolio/projects/route";
import { POST as createClassroomPost } from "@/app/api/educator/classrooms/route";
import { GET as getFileRoute } from "@/app/api/files/[fileId]/route";

describe("Fase 2 — Hardening de Aplicação e LGPD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SEC-10: getSharedPortfolioByToken retorna null para estudante suspenso", async () => {
    const mockPrisma = {
      portfolioShareLink: {
        findUnique: vi.fn().mockResolvedValue({
          studentId: "stu-suspenso",
          active: true,
          revokedAt: null,
          student: { name: "Aluno Suspenso", status: "SUSPENDED" },
        }),
      },
      portfolioProject: {
        findMany: vi.fn(),
      },
    };

    const result = await getSharedPortfolioByToken(
      "valid-token",
      mockPrisma as unknown as Parameters<typeof getSharedPortfolioByToken>[1],
    );

    expect(result).toBeNull();
    expect(mockPrisma.portfolioProject.findMany).not.toHaveBeenCalled();
  });

  it("SEC-04: POST /api/portfolio/projects e POST /api/educator/classrooms retornam 400 para JSON null ou array", async () => {
    vi.mocked(requireApiRole).mockResolvedValue({
      userId: "user-1",
      role: Role.ESTUDANTE,
      institutionId: "inst-1",
    });

    const nullPortfolioReq = new Request("http://localhost/api/portfolio/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null",
    });
    const res1 = await createPortfolioPost(nullPortfolioReq);
    expect(res1.status).toBe(400);

    const arrayClassroomReq = new Request("http://localhost/api/educator/classrooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "[]",
    });
    const res2 = await createClassroomPost(arrayClassroomReq);
    expect(res2.status).toBe(400);

    const nullClassroomReq = new Request("http://localhost/api/educator/classrooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null",
    });
    const res3 = await createClassroomPost(nullClassroomReq);
    expect(res3.status).toBe(400);
  });

  it("SEC-08: GET /api/files/[fileId] entrega PDF como attachment e com CSP sandbox", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(authorizeFileAccess).mockResolvedValue({
      ok: true,
      storageKey: "stu-1/evidencia.pdf",
      file: {
        id: "file-1",
        originalName: "evidencia.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10,
      },
    });
    const pdfBytes = Buffer.from("%PDF-1.4\n");
    vi.mocked(openStoredFileStream).mockResolvedValue({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(pdfBytes));
          controller.close();
        },
      }),
      sizeBytes: pdfBytes.length,
    });

    const req = new Request("http://localhost/api/files/file-1", {
      headers: {
        cookie: `${SHARE_TOKEN_COOKIE_NAME}=abc`,
      },
    });
    const res = await getFileRoute(req, {
      params: Promise.resolve({ fileId: "file-1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Length")).toBe(String(pdfBytes.length));
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="evidencia.pdf"',
    );
    expect(res.headers.get("Content-Security-Policy")).toBe("sandbox");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res).toBeInstanceOf(NextResponse);
    expect(authorizeFileAccess).toHaveBeenCalledWith({
      fileId: "file-1",
      sessionUser: null,
      shareToken: "abc",
    });
    expect(openStoredFileStream).toHaveBeenCalledWith("stu-1/evidencia.pdf");
  });
});
