import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateExternalUrlStructure } from "@/lib/link-checker";
import {
  deleteStoredFile,
  FileValidationError,
  MAX_STUDENT_EVIDENCE_FILES,
  saveEvidenceFile,
  type SavedEvidenceFile,
} from "@/lib/storage/local-files";

export const MIN_CHALLENGE_REFLECTION_LENGTH = 10;
export const MAX_CHALLENGE_TITLE_LENGTH = 150;
export const MAX_CHALLENGE_REFLECTION_LENGTH = 5000;
export const MAX_CHALLENGE_EXTERNAL_URL_LENGTH = 2048;

export class ChallengeSubmissionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ChallengeSubmissionError";
    this.status = status;
  }
}

export interface SubmitChallengeInput {
  studentId: string;
  challengeId: string;
  title?: string | null;
  reflection: string;
  externalUrl?: string | null;
  isIncludedInShare?: boolean;
  file?: File | null;
}

export interface SubmitChallengeDeps {
  prismaClient?: PrismaClient;
  saveFile?: (file: File, ownerId: string) => Promise<SavedEvidenceFile>;
  deleteFile?: (storageKey: string) => Promise<void>;
}

function normalizeOptionalExternalUrl(rawUrl?: string | null): string | null {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_CHALLENGE_EXTERNAL_URL_LENGTH) {
    throw new ChallengeSubmissionError(
      `A URL externa deve ter no máximo ${MAX_CHALLENGE_EXTERNAL_URL_LENGTH} caracteres.`,
      400,
    );
  }

  const check = validateExternalUrlStructure(trimmed);
  if (!check.safe || !check.parsed) {
    throw new ChallengeSubmissionError(
      check.reason ?? "Informe uma URL externa válida (ex.: https://...).",
      400,
    );
  }

  return check.parsed.toString();
}

function buildProjectSummary(reflection: string): string {
  const singleLine = reflection.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 160) {
    return singleLine;
  }
  return `${singleLine.slice(0, 157)}...`;
}

/**
 * Submete um desafio prático da etapa Experimentar, criando um `PortfolioProject`
 * e opcionalmente um `EvidenceFile` em transação atômica com rollback de arquivo em disco.
 */
export async function submitChallenge(
  input: SubmitChallengeInput,
  deps: SubmitChallengeDeps = {},
) {
  const prismaClient = deps.prismaClient ?? prisma;
  const saveFile = deps.saveFile ?? saveEvidenceFile;
  const deleteFile = deps.deleteFile ?? deleteStoredFile;

  const trimmedTitle = (input.title ?? "").trim();
  if (trimmedTitle.length > MAX_CHALLENGE_TITLE_LENGTH) {
    throw new ChallengeSubmissionError(
      `O título deve ter no máximo ${MAX_CHALLENGE_TITLE_LENGTH} caracteres.`,
      400,
    );
  }

  const trimmedReflection = (input.reflection ?? "").trim();
  if (trimmedReflection.length < MIN_CHALLENGE_REFLECTION_LENGTH) {
    throw new ChallengeSubmissionError(
      `Descreva sua solução e aprendizado com pelo menos ${MIN_CHALLENGE_REFLECTION_LENGTH} caracteres.`,
      400,
    );
  }
  if (trimmedReflection.length > MAX_CHALLENGE_REFLECTION_LENGTH) {
    throw new ChallengeSubmissionError(
      `A reflexão deve ter no máximo ${MAX_CHALLENGE_REFLECTION_LENGTH} caracteres.`,
      400,
    );
  }

  const normalizedUrl = normalizeOptionalExternalUrl(input.externalUrl);

  const challenge = await prismaClient.challenge.findFirst({
    where: {
      id: input.challengeId,
      published: true,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!challenge) {
    throw new ChallengeSubmissionError("Desafio não encontrado.", 404);
  }

  const projectTitle = trimmedTitle || challenge.title;
  const projectSummary = buildProjectSummary(trimmedReflection);
  const isIncludedInShare = input.isIncludedInShare ?? true;

  let savedFile: SavedEvidenceFile | null = null;
  if (input.file && input.file.size > 0) {
    if (typeof prismaClient.evidenceFile?.count === "function") {
      const existingFileCount = await prismaClient.evidenceFile.count({
        where: { project: { studentId: input.studentId } },
      });
      if (existingFileCount >= MAX_STUDENT_EVIDENCE_FILES) {
        throw new ChallengeSubmissionError(
          "Limite máximo de arquivos atingido na conta.",
          400,
        );
      }
    }

    try {
      savedFile = await saveFile(input.file, input.studentId);
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw new ChallengeSubmissionError(error.message, error.status);
      }
      throw error;
    }
  }

  try {
    return await prismaClient.$transaction(async (tx) => {
      const project = await tx.portfolioProject.create({
        data: {
          studentId: input.studentId,
          challengeId: challenge.id,
          title: projectTitle,
          summary: projectSummary,
          reflection: trimmedReflection,
          externalUrl: normalizedUrl,
          isIncludedInShare,
        },
      });

      let evidenceFile = null;
      if (savedFile) {
        evidenceFile = await tx.evidenceFile.create({
          data: {
            projectId: project.id,
            storageKey: savedFile.storageKey,
            originalName: savedFile.originalName,
            mimeType: savedFile.mimeType,
            sizeBytes: savedFile.sizeBytes,
          },
        });
      }

      return {
        project,
        evidenceFile,
      };
    });
  } catch (error) {
    if (savedFile) {
      await deleteFile(savedFile.storageKey).catch(() => undefined);
    }
    throw error;
  }
}
