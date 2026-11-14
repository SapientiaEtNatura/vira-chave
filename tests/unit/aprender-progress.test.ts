import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgressStatus } from "@prisma/client";
import {
  completeCourseProgress,
  CourseProgressError,
  startCourseProgress,
} from "@/lib/aprender/progress";
import {
  deleteStoredFile,
  readStoredFile,
  saveEvidenceFile,
  validateEvidenceBuffer,
} from "@/lib/storage/local-files";

function createMockPrisma(overrides?: {
  courseItem?: {
    id: string;
    title: string;
    providerName: string;
    externalUrl: string;
    track: { id: string; title: string; published: boolean };
  } | null;
  existingProgress?: {
    id: string;
    studentId: string;
    courseItemId: string;
    status: ProgressStatus;
    notes: string | null;
    certificateFileId: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
  } | null;
}) {
  const courseItemFindFirst = vi.fn().mockResolvedValue(
    overrides && "courseItem" in overrides
      ? overrides.courseItem
      : {
          id: "course-1",
          title: "Lógica de Programação",
          providerName: "Curso em Vídeo",
          externalUrl: "https://example.com/curso",
          track: {
            id: "track-1",
            title: "Fundamentos de Tecnologia",
            published: true,
          },
        },
  );

  const progressFindUnique = vi.fn().mockResolvedValue(
    overrides && "existingProgress" in overrides
      ? overrides.existingProgress
      : null,
  );

  const progressUpsert = vi.fn(async ({ create, update }) => ({
    id: "prog-1",
    ...(overrides?.existingProgress ?? create),
    ...(overrides?.existingProgress ? update : {}),
  }));

  const portfolioProjectCreate = vi.fn(async ({ data }) => ({
    id: "proj-1",
    ...data,
  }));

  const evidenceFileCreate = vi.fn(async ({ data }) => ({
    id: "ev-1",
    ...data,
  }));

  const tx = {
    courseItem: { findFirst: courseItemFindFirst },
    courseProgress: {
      findUnique: progressFindUnique,
      upsert: progressUpsert,
    },
    portfolioProject: { create: portfolioProjectCreate },
    evidenceFile: { create: evidenceFileCreate },
  };

  const prismaMock = {
    ...tx,
    $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) =>
      cb(tx),
    ),
  };

  return {
    prismaMock,
    progressUpsert,
    portfolioProjectCreate,
    evidenceFileCreate,
  };
}

describe("Etapa Aprender — Progresso Semi-Automático e Storage Seguro", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    delete process.env.UPLOAD_DIR;
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("test_start_course_transitions_to_em_andamento_with_started_at", async () => {
    // Caso 1: sem progresso prévio -> transiciona para EM_ANDAMENTO com startedAt
    const freshMocks = createMockPrisma({ existingProgress: null });
    const started = await startCourseProgress(
      { studentId: "student-1", courseItemId: "course-1" },
      freshMocks.prismaMock as never,
    );

    expect(started.status).toBe(ProgressStatus.EM_ANDAMENTO);
    expect(started.startedAt).toBeInstanceOf(Date);
    expect(freshMocks.progressUpsert).toHaveBeenCalledTimes(1);

    // Caso 2: já CONCLUIDO -> preserva CONCLUIDO e completedAt
    const completedAt = new Date("2026-01-10T12:00:00.000Z");
    const startedAt = new Date("2026-01-09T10:00:00.000Z");
    const doneMocks = createMockPrisma({
      existingProgress: {
        id: "prog-done",
        studentId: "student-1",
        courseItemId: "course-1",
        status: ProgressStatus.CONCLUIDO,
        notes: "Aprendi variáveis e laços.",
        certificateFileId: null,
        startedAt,
        completedAt,
      },
    });

    const preserved = await startCourseProgress(
      { studentId: "student-1", courseItemId: "course-1" },
      doneMocks.prismaMock as never,
    );

    expect(preserved.status).toBe(ProgressStatus.CONCLUIDO);
    expect(preserved.completedAt).toEqual(completedAt);
    expect(doneMocks.progressUpsert).not.toHaveBeenCalled();
  });

  it("test_complete_course_requires_non_empty_summary", async () => {
    const mocks = createMockPrisma();

    await expect(
      completeCourseProgress(
        {
          studentId: "student-1",
          courseItemId: "course-1",
          notes: "",
        },
        { prismaClient: mocks.prismaMock as never },
      ),
    ).rejects.toThrow(CourseProgressError);

    await expect(
      completeCourseProgress(
        {
          studentId: "student-1",
          courseItemId: "course-1",
          notes: "   abc ",
        },
        { prismaClient: mocks.prismaMock as never },
      ),
    ).rejects.toThrow(CourseProgressError);

    expect(mocks.progressUpsert).not.toHaveBeenCalled();

    // Mini-resumo válido (>= 5 chars) conclui o curso
    const completed = await completeCourseProgress(
      {
        studentId: "student-1",
        courseItemId: "course-1",
        notes: "Aprendi estruturas condicionais e funções.",
      },
      { prismaClient: mocks.prismaMock as never },
    );

    expect(completed.status).toBe(ProgressStatus.CONCLUIDO);
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(completed.notes).toBe("Aprendi estruturas condicionais e funções.");
    expect(mocks.progressUpsert).toHaveBeenCalledTimes(1);

    // Com certificado anexado, cria PortfolioProject + EvidenceFile e vincula certificateFileId
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "virachave-cert-"));
    tempDirs.push(tmpDir);
    process.env.UPLOAD_DIR = tmpDir;

    const certFile = new File(
      [Buffer.from("%PDF-1.4\n%cert")],
      "certificado.pdf",
      { type: "application/pdf" },
    );

    const withCert = await completeCourseProgress(
      {
        studentId: "student-1",
        courseItemId: "course-1",
        notes: "Concluí o curso com certificado.",
        file: certFile,
        addToPortfolio: true,
      },
      { prismaClient: mocks.prismaMock as never },
    );

    expect(mocks.portfolioProjectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "student-1",
          isIncludedInShare: true,
        }),
      }),
    );
    expect(mocks.evidenceFileCreate).toHaveBeenCalledTimes(1);
    expect(withCert.certificateFileId).toBe("ev-1");
  });

  it("test_upload_rejects_invalid_magic_bytes_or_oversized_file", async () => {
    // Rejeita .exe (MZ) renomeado para .pdf
    const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    expect(() => validateEvidenceBuffer("certificado.pdf", fakeExe)).toThrow();

    // Rejeita arquivo > 5MB mesmo com magic bytes de PDF
    const oversizedPdf = Buffer.alloc(5 * 1024 * 1024 + 1);
    Buffer.from("%PDF-1.4").copy(oversizedPdf, 0);
    expect(() =>
      validateEvidenceBuffer("grande.pdf", oversizedPdf),
    ).toThrow();

    // Rejeita arquivo vazio
    expect(() =>
      validateEvidenceBuffer("vazio.pdf", Buffer.alloc(0)),
    ).toThrow();

    // Aceita PDF, PNG e JPG válidos
    const validPdf = Buffer.from("%PDF-1.4\n%...");
    expect(validateEvidenceBuffer("cert.pdf", validPdf)).toEqual({
      mimeType: "application/pdf",
      ext: "pdf",
    });

    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    expect(validateEvidenceBuffer("cert.png", validPng)).toEqual({
      mimeType: "image/png",
      ext: "png",
    });

    const validJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateEvidenceBuffer("cert.jpg", validJpg)).toEqual({
      mimeType: "image/jpeg",
      ext: "jpg",
    });

    // Testa persistência, leitura, remoção e proteção contra path traversal
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "virachave-upload-"));
    tempDirs.push(tmpDir);
    process.env.UPLOAD_DIR = tmpDir;

    const file = new File([validPdf], "meu-certificado.pdf", {
      type: "application/pdf",
    });
    const saved = await saveEvidenceFile(file, "student-1");
    expect(saved.storageKey).toMatch(/^student-1\/.+\.pdf$/);
    expect(saved.mimeType).toBe("application/pdf");
    expect(saved.sizeBytes).toBe(validPdf.length);

    const readBack = await readStoredFile(saved.storageKey);
    expect(readBack.equals(validPdf)).toBe(true);

    await expect(readStoredFile("../outside.pdf")).rejects.toThrow();
    await expect(deleteStoredFile("../../outside.pdf")).rejects.toThrow();

    await deleteStoredFile(saved.storageKey);
    await expect(readStoredFile(saved.storageKey)).rejects.toThrow();
  });
});
