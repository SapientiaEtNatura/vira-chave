import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deleteStoredFile,
  FileValidationError,
  saveEvidenceFile,
  type SavedEvidenceFile,
} from "@/lib/storage/local-files";

export const MIN_CHALLENGE_REFLECTION_LENGTH = 10;

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

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ChallengeSubmissionError(
      "Informe uma URL externa válida (ex.: https://...).",
      400,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ChallengeSubmissionError(
      "A URL externa deve começar com http:// ou https://.",
      400,
    );
  }

  return parsed.toString();
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

  const trimmedReflection = (input.reflection ?? "").trim();
  if (trimmedReflection.length < MIN_CHALLENGE_REFLECTION_LENGTH) {
    throw new ChallengeSubmissionError(
      `Descreva sua solução e aprendizado com pelo menos ${MIN_CHALLENGE_REFLECTION_LENGTH} caracteres.`,
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

  const trimmedTitle = (input.title ?? "").trim();
  const projectTitle = trimmedTitle || challenge.title;
  const projectSummary = buildProjectSummary(trimmedReflection);
  const isIncludedInShare = input.isIncludedInShare ?? true;

  let savedFile: SavedEvidenceFile | null = null;
  if (input.file && input.file.size > 0) {
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
