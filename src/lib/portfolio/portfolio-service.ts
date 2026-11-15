import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashShareToken } from "@/lib/portfolio/share-token";
import {
  deleteStoredFile,
  FileValidationError,
  saveEvidenceFile,
  type SavedEvidenceFile,
} from "@/lib/storage/local-files";

export const MIN_PROJECT_TITLE_LENGTH = 2;
export const MAX_PROJECT_TITLE_LENGTH = 150;
export const MAX_PROJECT_SUMMARY_LENGTH = 300;
export const MIN_PROJECT_REFLECTION_LENGTH = 10;
export const MAX_PROJECT_REFLECTION_LENGTH = 5000;
export const MAX_PROJECT_EXTERNAL_URL_LENGTH = 2048;

export const updatePortfolioProjectSchema = z
  .object({
    title: z
      .string({ message: "Título inválido." })
      .trim()
      .min(
        MIN_PROJECT_TITLE_LENGTH,
        `Informe um título com pelo menos ${MIN_PROJECT_TITLE_LENGTH} caracteres.`,
      )
      .max(
        MAX_PROJECT_TITLE_LENGTH,
        `O título deve ter no máximo ${MAX_PROJECT_TITLE_LENGTH} caracteres.`,
      )
      .optional(),
    summary: z
      .string({ message: "Resumo inválido." })
      .trim()
      .max(
        MAX_PROJECT_SUMMARY_LENGTH,
        `O resumo deve ter no máximo ${MAX_PROJECT_SUMMARY_LENGTH} caracteres.`,
      )
      .optional(),
    reflection: z
      .string({ message: "Reflexão inválida." })
      .trim()
      .min(
        MIN_PROJECT_REFLECTION_LENGTH,
        `Descreva sua reflexão com pelo menos ${MIN_PROJECT_REFLECTION_LENGTH} caracteres.`,
      )
      .max(
        MAX_PROJECT_REFLECTION_LENGTH,
        `A reflexão deve ter no máximo ${MAX_PROJECT_REFLECTION_LENGTH} caracteres.`,
      )
      .optional(),
    externalUrl: z
      .union([
        z
          .string({ message: "URL externa inválida." })
          .trim()
          .max(
            MAX_PROJECT_EXTERNAL_URL_LENGTH,
            `A URL externa deve ter no máximo ${MAX_PROJECT_EXTERNAL_URL_LENGTH} caracteres.`,
          ),
        z.null(),
      ])
      .optional(),
    isIncludedInShare: z
      .boolean({ message: "Valor de compartilhamento inválido." })
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.summary !== undefined ||
      data.reflection !== undefined ||
      data.externalUrl !== undefined ||
      data.isIncludedInShare !== undefined,
    { message: "Nenhuma alteração válida informada." },
  );

export class PortfolioServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PortfolioServiceError";
    this.status = status;
  }
}

export interface SharedPortfolioEvidenceFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SharedPortfolioProject {
  id: string;
  title: string;
  summary: string;
  reflection: string;
  externalUrl: string | null;
  challengeTitle: string | null;
  evidenceFiles: SharedPortfolioEvidenceFile[];
}

export interface SharedPortfolioView {
  studentDisplayName: string;
  projects: SharedPortfolioProject[];
}

export interface GenerateShareLinkResult {
  rawToken: string;
  createdAt: Date;
}

type SharePrismaClient = Pick<
  PrismaClient,
  "portfolioShareLink" | "portfolioProject" | "$transaction"
>;

function normalizeOptionalExternalUrl(rawUrl?: string | null): string | null {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_PROJECT_EXTERNAL_URL_LENGTH) {
    throw new PortfolioServiceError(
      `A URL externa deve ter no máximo ${MAX_PROJECT_EXTERNAL_URL_LENGTH} caracteres.`,
      400,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new PortfolioServiceError(
      "Informe uma URL externa válida (ex.: https://...).",
      400,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PortfolioServiceError(
      "A URL externa deve começar com http:// ou https://.",
      400,
    );
  }

  return parsed.toString();
}

function buildSummaryFromReflection(reflection: string): string {
  const singleLine = reflection.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 160) {
    return singleLine;
  }
  return `${singleLine.slice(0, 157)}...`;
}

/**
 * Revoga todos os links de compartilhamento ativos de um estudante.
 */
export async function revokeShareLinks(
  studentId: string,
  prismaClient: Pick<PrismaClient, "portfolioShareLink"> = prisma,
) {
  return prismaClient.portfolioShareLink.updateMany({
    where: {
      studentId,
      active: true,
    },
    data: {
      active: false,
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoga links ativos anteriores do estudante e gera um novo link de compartilhamento,
 * armazenando apenas o hash SHA-256 do token no banco.
 */
export async function generateShareLink(
  studentId: string,
  prismaClient: Pick<
    PrismaClient,
    "portfolioShareLink" | "$transaction"
  > = prisma,
): Promise<GenerateShareLinkResult> {
  const rawToken = crypto.randomBytes(24).toString("base64url");
  const tokenHash = hashShareToken(rawToken);
  const now = new Date();

  const created = await prismaClient.$transaction(async (tx) => {
    await tx.portfolioShareLink.updateMany({
      where: {
        studentId,
        active: true,
      },
      data: {
        active: false,
        revokedAt: now,
      },
    });

    return tx.portfolioShareLink.create({
      data: {
        studentId,
        tokenHash,
        active: true,
      },
      select: {
        createdAt: true,
      },
    });
  });

  return {
    rawToken,
    createdAt: created.createdAt,
  };
}

/**
 * Retorna a visão pública somente-leitura do portfólio para um token ativo,
 * contendo apenas projetos com `isIncludedInShare: true` e zero dados pessoais (PII).
 */
export async function getSharedPortfolioByToken(
  rawToken: string,
  prismaClient: Pick<
    SharePrismaClient,
    "portfolioShareLink" | "portfolioProject"
  > = prisma,
): Promise<SharedPortfolioView | null> {
  const trimmedToken = rawToken?.trim();
  if (!trimmedToken) {
    return null;
  }

  const tokenHash = hashShareToken(trimmedToken);
  const shareLink = await prismaClient.portfolioShareLink.findUnique({
    where: { tokenHash },
    select: {
      studentId: true,
      active: true,
      revokedAt: true,
      student: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!shareLink || !shareLink.active || shareLink.revokedAt !== null) {
    return null;
  }

  const projects = await prismaClient.portfolioProject.findMany({
    where: {
      studentId: shareLink.studentId,
      isIncludedInShare: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      reflection: true,
      externalUrl: true,
      challenge: {
        select: {
          title: true,
        },
      },
      evidenceFiles: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });

  return {
    studentDisplayName: shareLink.student.name,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      summary: project.summary,
      reflection: project.reflection,
      externalUrl: project.externalUrl,
      challengeTitle: project.challenge?.title ?? null,
      evidenceFiles: project.evidenceFiles.map((file) => ({
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })),
    })),
  };
}

export interface CreatePortfolioProjectInput {
  studentId: string;
  title: string;
  summary?: string | null;
  reflection: string;
  externalUrl?: string | null;
  isIncludedInShare?: boolean;
  file?: File | null;
}

export async function createPortfolioProject(
  input: CreatePortfolioProjectInput,
  deps: {
    prismaClient?: PrismaClient;
    saveFile?: (file: File, ownerId: string) => Promise<SavedEvidenceFile>;
    deleteFile?: (storageKey: string) => Promise<void>;
  } = {},
) {
  const prismaClient = deps.prismaClient ?? prisma;
  const saveFile = deps.saveFile ?? saveEvidenceFile;
  const deleteFile = deps.deleteFile ?? deleteStoredFile;

  const trimmedTitle = (input.title ?? "").trim();
  if (trimmedTitle.length < MIN_PROJECT_TITLE_LENGTH) {
    throw new PortfolioServiceError(
      `Informe um título com pelo menos ${MIN_PROJECT_TITLE_LENGTH} caracteres.`,
      400,
    );
  }

  const trimmedReflection = (input.reflection ?? "").trim();
  if (trimmedReflection.length < MIN_PROJECT_REFLECTION_LENGTH) {
    throw new PortfolioServiceError(
      `Descreva sua reflexão com pelo menos ${MIN_PROJECT_REFLECTION_LENGTH} caracteres.`,
      400,
    );
  }

  const trimmedSummary = (input.summary ?? "").trim();
  const projectSummary =
    trimmedSummary || buildSummaryFromReflection(trimmedReflection);
  const normalizedUrl = normalizeOptionalExternalUrl(input.externalUrl);
  const isIncludedInShare = input.isIncludedInShare ?? true;

  let savedFile: SavedEvidenceFile | null = null;
  if (input.file && input.file.size > 0) {
    try {
      savedFile = await saveFile(input.file, input.studentId);
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw new PortfolioServiceError(error.message, error.status);
      }
      throw error;
    }
  }

  try {
    return await prismaClient.$transaction(async (tx) => {
      const project = await tx.portfolioProject.create({
        data: {
          studentId: input.studentId,
          title: trimmedTitle,
          summary: projectSummary,
          reflection: trimmedReflection,
          externalUrl: normalizedUrl,
          isIncludedInShare,
        },
        include: {
          challenge: {
            select: { title: true },
          },
          evidenceFiles: {
            select: {
              id: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
            },
          },
        },
      });

      if (savedFile) {
        const evidence = await tx.evidenceFile.create({
          data: {
            projectId: project.id,
            storageKey: savedFile.storageKey,
            originalName: savedFile.originalName,
            mimeType: savedFile.mimeType,
            sizeBytes: savedFile.sizeBytes,
          },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        });
        project.evidenceFiles.push(evidence);
      }

      return project;
    });
  } catch (error) {
    if (savedFile) {
      await deleteFile(savedFile.storageKey).catch(() => undefined);
    }
    throw error;
  }
}

export interface UpdatePortfolioProjectInput {
  title?: string;
  summary?: string;
  reflection?: string;
  externalUrl?: string | null;
  isIncludedInShare?: boolean;
}

export async function updatePortfolioProject(
  studentId: string,
  projectId: string,
  input: UpdatePortfolioProjectInput,
  prismaClient: PrismaClient = prisma,
) {
  const existing = await prismaClient.portfolioProject.findFirst({
    where: {
      id: projectId,
      studentId,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      reflection: true,
      externalUrl: true,
      isIncludedInShare: true,
    },
  });

  if (!existing) {
    throw new PortfolioServiceError("Projeto não encontrado.", 404);
  }

  const nextData: {
    title?: string;
    summary?: string;
    reflection?: string;
    externalUrl?: string | null;
    isIncludedInShare?: boolean;
  } = {};

  if (input.title !== undefined) {
    const trimmedTitle = input.title.trim();
    if (trimmedTitle.length < MIN_PROJECT_TITLE_LENGTH) {
      throw new PortfolioServiceError(
        `Informe um título com pelo menos ${MIN_PROJECT_TITLE_LENGTH} caracteres.`,
        400,
      );
    }
    if (trimmedTitle.length > MAX_PROJECT_TITLE_LENGTH) {
      throw new PortfolioServiceError(
        `O título deve ter no máximo ${MAX_PROJECT_TITLE_LENGTH} caracteres.`,
        400,
      );
    }
    nextData.title = trimmedTitle;
  }

  if (input.reflection !== undefined) {
    const trimmedReflection = input.reflection.trim();
    if (trimmedReflection.length < MIN_PROJECT_REFLECTION_LENGTH) {
      throw new PortfolioServiceError(
        `Descreva sua reflexão com pelo menos ${MIN_PROJECT_REFLECTION_LENGTH} caracteres.`,
        400,
      );
    }
    if (trimmedReflection.length > MAX_PROJECT_REFLECTION_LENGTH) {
      throw new PortfolioServiceError(
        `A reflexão deve ter no máximo ${MAX_PROJECT_REFLECTION_LENGTH} caracteres.`,
        400,
      );
    }
    nextData.reflection = trimmedReflection;
  }

  if (input.summary !== undefined) {
    const trimmedSummary = input.summary.trim();
    if (trimmedSummary.length > MAX_PROJECT_SUMMARY_LENGTH) {
      throw new PortfolioServiceError(
        `O resumo deve ter no máximo ${MAX_PROJECT_SUMMARY_LENGTH} caracteres.`,
        400,
      );
    }
    nextData.summary =
      trimmedSummary ||
      buildSummaryFromReflection(nextData.reflection ?? existing.reflection);
  }

  if (input.externalUrl !== undefined) {
    nextData.externalUrl = normalizeOptionalExternalUrl(input.externalUrl);
  }

  if (input.isIncludedInShare !== undefined) {
    nextData.isIncludedInShare = Boolean(input.isIncludedInShare);
  }

  if (Object.keys(nextData).length === 0) {
    throw new PortfolioServiceError("Nenhuma alteração válida informada.", 400);
  }

  return prismaClient.portfolioProject.update({
    where: { id: existing.id },
    data: nextData,
    include: {
      challenge: {
        select: { title: true },
      },
      evidenceFiles: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });
}

export async function deletePortfolioProject(
  studentId: string,
  projectId: string,
  deps: {
    prismaClient?: PrismaClient;
    deleteFile?: (storageKey: string) => Promise<void>;
  } = {},
) {
  const prismaClient = deps.prismaClient ?? prisma;
  const deleteFile = deps.deleteFile ?? deleteStoredFile;

  const existing = await prismaClient.portfolioProject.findFirst({
    where: {
      id: projectId,
      studentId,
    },
    select: {
      id: true,
      evidenceFiles: {
        select: {
          storageKey: true,
        },
      },
    },
  });

  if (!existing) {
    throw new PortfolioServiceError("Projeto não encontrado.", 404);
  }

  await prismaClient.portfolioProject.delete({
    where: { id: existing.id },
  });

  await Promise.all(
    existing.evidenceFiles.map((file) =>
      deleteFile(file.storageKey).catch(() => undefined),
    ),
  );
}
