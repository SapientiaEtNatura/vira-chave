import { describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { submitChallenge } from "@/lib/experimentar/submit-challenge";
import { authorizeAndReadFile } from "@/lib/files/authorize-file";
import { hashShareToken } from "@/lib/portfolio/share-token";

describe("Etapa Experimentar — Submissão de Desafios e Endpoint Protegido de Arquivos", () => {
  it("test_submit_challenge_creates_portfolio_project_and_evidence_file", async () => {
    const projectCreate = vi.fn(async ({ data }) => ({
      id: "proj-1",
      ...data,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    }));
    const evidenceFileCreate = vi.fn(async ({ data }) => ({
      id: "file-1",
      ...data,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    }));

    const tx = {
      portfolioProject: { create: projectCreate },
      evidenceFile: { create: evidenceFileCreate },
    };

    const prismaMock = {
      challenge: {
        findFirst: vi.fn().mockResolvedValue({
          id: "challenge-1",
          title: "Criar um Protótipo de App Comunitário",
          description: "Descreva um problema local e crie um protótipo.",
          published: true,
        }),
      },
      $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) =>
        cb(tx),
      ),
    };

    const saveFileMock = vi.fn().mockResolvedValue({
      storageKey: "student-1/uuid.pdf",
      originalName: "prototipo.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });
    const deleteFileMock = vi.fn().mockResolvedValue(undefined);

    const fakeFile = new File([Buffer.from("%PDF-1.4\n")], "prototipo.pdf", {
      type: "application/pdf",
    });

    const result = await submitChallenge(
      {
        studentId: "student-1",
        challengeId: "challenge-1",
        title: "Meu Protótipo",
        reflection: "Aprendi a mapear necessidades reais da comunidade.",
        externalUrl: "https://example.com/prototipo",
        isIncludedInShare: true,
        file: fakeFile,
      },
      {
        prismaClient: prismaMock as never,
        saveFile: saveFileMock,
        deleteFile: deleteFileMock,
      },
    );

    expect(saveFileMock).toHaveBeenCalledWith(fakeFile, "student-1");
    expect(projectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: "student-1",
        challengeId: "challenge-1",
        title: "Meu Protótipo",
        reflection: "Aprendi a mapear necessidades reais da comunidade.",
        externalUrl: "https://example.com/prototipo",
        isIncludedInShare: true,
      }),
    });
    expect(evidenceFileCreate).toHaveBeenCalledWith({
      data: {
        projectId: "proj-1",
        storageKey: "student-1/uuid.pdf",
        originalName: "prototipo.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      },
    });
    expect(deleteFileMock).not.toHaveBeenCalled();
    expect(result.project.id).toBe("proj-1");
    expect(result.evidenceFile?.id).toBe("file-1");
  });

  it("test_file_route_denies_other_student_and_educator_without_active_share_token", async () => {
    const prismaMock = {
      evidenceFile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "file-1",
          storageKey: "student-owner/doc.pdf",
          originalName: "doc.pdf",
          mimeType: "application/pdf",
          sizeBytes: 512,
          project: {
            studentId: "student-owner",
            isIncludedInShare: true,
          },
        }),
      },
      portfolioShareLink: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    const readFileMock = vi.fn().mockResolvedValue(Buffer.from("%PDF-1.4"));

    // Sem sessão e sem shareToken -> 401
    const unauthResult = await authorizeAndReadFile(
      { fileId: "file-1", sessionUser: null, shareToken: null },
      prismaMock as never,
      readFileMock,
    );
    expect(unauthResult.ok).toBe(false);
    if (!unauthResult.ok) {
      expect(unauthResult.status).toBe(401);
    }

    // Outro estudante autenticado sem shareToken -> 403
    const otherStudentResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: { id: "student-other", role: Role.ESTUDANTE },
        shareToken: null,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(otherStudentResult.ok).toBe(false);
    if (!otherStudentResult.ok) {
      expect(otherStudentResult.status).toBe(403);
    }

    // Educador autenticado sem shareToken -> 403
    const educatorResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: { id: "educator-1", role: Role.EDUCADOR },
        shareToken: null,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(educatorResult.ok).toBe(false);
    if (!educatorResult.ok) {
      expect(educatorResult.status).toBe(403);
    }

    // Admin autenticado sem shareToken -> 403
    const adminResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: { id: "admin-1", role: Role.ADMIN },
        shareToken: null,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(adminResult.ok).toBe(false);
    if (!adminResult.ok) {
      expect(adminResult.status).toBe(403);
    }

    expect(readFileMock).not.toHaveBeenCalled();
  });

  it("test_file_route_allows_owner_and_active_share_token_for_shared_project", async () => {
    const rawToken = "secret-share-token-123";
    const expectedHash = hashShareToken(rawToken);
    const pdfBuffer = Buffer.from("%PDF-1.4\nconteudo");
    const readFileMock = vi.fn().mockResolvedValue(pdfBuffer);

    const sharedEvidence = {
      id: "file-1",
      storageKey: "student-owner/doc.pdf",
      originalName: "doc.pdf",
      mimeType: "application/pdf",
      sizeBytes: pdfBuffer.length,
      project: {
        studentId: "student-owner",
        isIncludedInShare: true,
      },
    };

    const prismaMock = {
      evidenceFile: {
        findUnique: vi.fn().mockResolvedValue(sharedEvidence),
      },
      portfolioShareLink: {
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: { tokenHash: string };
          }): Promise<{
            id: string;
            studentId: string;
            tokenHash: string;
            active: boolean;
            revokedAt: Date | null;
          } | null> => {
            if (where.tokenHash === expectedHash) {
              return {
                id: "link-1",
                studentId: "student-owner",
                tokenHash: expectedHash,
                active: true,
                revokedAt: null,
              };
            }
            return null;
          },
        ),
      },
    };

    // 1. Dono autenticado -> PERMITIDO
    const ownerResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: { id: "student-owner", role: Role.ESTUDANTE },
        shareToken: null,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(ownerResult.ok).toBe(true);
    if (ownerResult.ok) {
      expect(ownerResult.buffer).toEqual(pdfBuffer);
      expect(ownerResult.file.mimeType).toBe("application/pdf");
    }

    // 2. Visitante com shareToken ativo e projeto incluído -> PERMITIDO
    const tokenResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: null,
        shareToken: rawToken,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(tokenResult.ok).toBe(true);

    // 3. Projeto privado (isIncludedInShare === false) mesmo com shareToken ativo -> NEGADO
    prismaMock.evidenceFile.findUnique.mockResolvedValueOnce({
      ...sharedEvidence,
      project: {
        studentId: "student-owner",
        isIncludedInShare: false,
      },
    });
    const privateProjectResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: null,
        shareToken: rawToken,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(privateProjectResult.ok).toBe(false);
    if (!privateProjectResult.ok) {
      expect(privateProjectResult.status).toBe(403);
    }

    // 4. Token revogado -> NEGADO (404)
    prismaMock.portfolioShareLink.findUnique.mockResolvedValueOnce({
      id: "link-1",
      studentId: "student-owner",
      tokenHash: expectedHash,
      active: false,
      revokedAt: new Date("2026-01-02T00:00:00Z"),
    });
    const revokedTokenResult = await authorizeAndReadFile(
      {
        fileId: "file-1",
        sessionUser: null,
        shareToken: rawToken,
      },
      prismaMock as never,
      readFileMock,
    );
    expect(revokedTokenResult.ok).toBe(false);
    if (!revokedTokenResult.ok) {
      expect(revokedTokenResult.status).toBe(404);
    }
  });
});
