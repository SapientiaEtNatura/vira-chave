import { ProgressStatus, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deleteStoredFile,
  FileValidationError,
  MAX_STUDENT_EVIDENCE_FILES,
  saveEvidenceFile,
  type SavedEvidenceFile,
} from "@/lib/storage/local-files";

export const MIN_COURSE_NOTES_LENGTH = 5;
export const MAX_COURSE_NOTES_LENGTH = 2000;

export class CourseProgressError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CourseProgressError";
    this.status = status;
  }
}

export async function startCourseProgress(
  input: { studentId: string; courseItemId: string },
  prismaClient: Pick<PrismaClient, "courseItem" | "courseProgress"> = prisma,
) {
  const [courseItem, existing] = await Promise.all([
    prismaClient.courseItem.findFirst({
      where: {
        id: input.courseItemId,
        track: { published: true },
      },
      select: { id: true },
    }),
    prismaClient.courseProgress.findUnique({
      where: {
        studentId_courseItemId: {
          studentId: input.studentId,
          courseItemId: input.courseItemId,
        },
      },
    }),
  ]);

  if (!courseItem) {
    throw new CourseProgressError("Curso não encontrado.", 404);
  }

  if (
    existing &&
    (existing.status === ProgressStatus.CONCLUIDO ||
      existing.status === ProgressStatus.EM_ANDAMENTO)
  ) {
    return existing;
  }

  const now = new Date();
  return prismaClient.courseProgress.upsert({
    where: {
      studentId_courseItemId: {
        studentId: input.studentId,
        courseItemId: input.courseItemId,
      },
    },
    create: {
      studentId: input.studentId,
      courseItemId: input.courseItemId,
      status: ProgressStatus.EM_ANDAMENTO,
      startedAt: now,
    },
    update: {
      status: ProgressStatus.EM_ANDAMENTO,
      startedAt: existing?.startedAt ?? now,
    },
  });
}

export interface CompleteCourseDeps {
  prismaClient?: PrismaClient;
  saveFile?: (file: File, ownerId: string) => Promise<SavedEvidenceFile>;
  deleteFile?: (storageKey: string) => Promise<void>;
}

export async function completeCourseProgress(
  input: {
    studentId: string;
    courseItemId: string;
    notes: string;
    file?: File | null;
    addToPortfolio?: boolean;
  },
  deps: CompleteCourseDeps = {},
) {
  const prismaClient = deps.prismaClient ?? prisma;
  const saveFile = deps.saveFile ?? saveEvidenceFile;
  const deleteFile = deps.deleteFile ?? deleteStoredFile;

  const trimmedNotes = (input.notes ?? "").trim();
  if (trimmedNotes.length < MIN_COURSE_NOTES_LENGTH) {
    throw new CourseProgressError(
      `Escreva um mini-resumo de pelo menos ${MIN_COURSE_NOTES_LENGTH} caracteres sobre o que você aprendeu.`,
      400,
    );
  }
  if (trimmedNotes.length > MAX_COURSE_NOTES_LENGTH) {
    throw new CourseProgressError(
      `O mini-resumo deve ter no máximo ${MAX_COURSE_NOTES_LENGTH} caracteres.`,
      400,
    );
  }

  const courseItem = await prismaClient.courseItem.findFirst({
    where: {
      id: input.courseItemId,
      track: { published: true },
    },
    select: {
      id: true,
      title: true,
      providerName: true,
      externalUrl: true,
      track: {
        select: {
          id: true,
          title: true,
          published: true,
        },
      },
    },
  });

  if (!courseItem) {
    throw new CourseProgressError("Curso não encontrado.", 404);
  }

  let savedFile: SavedEvidenceFile | null = null;
  if (input.file && input.file.size > 0) {
    if (typeof prismaClient.evidenceFile?.count === "function") {
      const [existingFileCount, existing] = await Promise.all([
        prismaClient.evidenceFile.count({
          where: { project: { studentId: input.studentId } },
        }),
        typeof prismaClient.courseProgress?.findUnique === "function"
          ? prismaClient.courseProgress.findUnique({
              where: {
                studentId_courseItemId: {
                  studentId: input.studentId,
                  courseItemId: input.courseItemId,
                },
              },
              select: { certificateFileId: true },
            })
          : Promise.resolve(null),
      ]);

      if (
        !existing?.certificateFileId &&
        existingFileCount >= MAX_STUDENT_EVIDENCE_FILES
      ) {
        throw new CourseProgressError(
          "Limite máximo de arquivos atingido na conta.",
          400,
        );
      }
    }

    try {
      savedFile = await saveFile(input.file, input.studentId);
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw new CourseProgressError(error.message, error.status);
      }
      throw error;
    }
  }

  const now = new Date();
  let oldStorageKeyToDelete: string | null = null;

  try {
    const updatedProgress = await prismaClient.$transaction(async (tx) => {
      const existing = await tx.courseProgress.findUnique({
        where: {
          studentId_courseItemId: {
            studentId: input.studentId,
            courseItemId: input.courseItemId,
          },
        },
      });

      let certificateFileId = existing?.certificateFileId ?? null;

      if (savedFile) {
        if (
          existing?.certificateFileId &&
          typeof tx.evidenceFile?.findUnique === "function"
        ) {
          const oldEvidence = await tx.evidenceFile.findUnique({
            where: { id: existing.certificateFileId },
            select: { id: true, storageKey: true, projectId: true },
          });
          if (oldEvidence) {
            if (typeof tx.portfolioProject?.delete === "function") {
              await tx.portfolioProject.delete({
                where: { id: oldEvidence.projectId },
              });
            } else if (typeof tx.evidenceFile?.delete === "function") {
              await tx.evidenceFile.delete({
                where: { id: oldEvidence.id },
              });
            }
            oldStorageKeyToDelete = oldEvidence.storageKey;
          }
        }

        const project = await tx.portfolioProject.create({
          data: {
            studentId: input.studentId,
            challengeId: null,
            title: `Certificado: ${courseItem.title}`,
            summary: trimmedNotes,
            reflection: `Curso concluído na trilha "${courseItem.track.title}" (${courseItem.providerName}).`,
            externalUrl: courseItem.externalUrl,
            isIncludedInShare: Boolean(input.addToPortfolio),
          },
        });

        const evidence = await tx.evidenceFile.create({
          data: {
            projectId: project.id,
            storageKey: savedFile.storageKey,
            originalName: savedFile.originalName,
            mimeType: savedFile.mimeType,
            sizeBytes: savedFile.sizeBytes,
          },
        });

        certificateFileId = evidence.id;
      }

      return tx.courseProgress.upsert({
        where: {
          studentId_courseItemId: {
            studentId: input.studentId,
            courseItemId: input.courseItemId,
          },
        },
        create: {
          studentId: input.studentId,
          courseItemId: input.courseItemId,
          status: ProgressStatus.CONCLUIDO,
          notes: trimmedNotes,
          certificateFileId,
          startedAt: now,
          completedAt: now,
        },
        update: {
          status: ProgressStatus.CONCLUIDO,
          notes: trimmedNotes,
          certificateFileId,
          startedAt: existing?.startedAt ?? now,
          completedAt: now,
        },
      });
    });

    if (oldStorageKeyToDelete) {
      await deleteFile(oldStorageKeyToDelete).catch(() => undefined);
    }

    return updatedProgress;
  } catch (error) {
    if (savedFile) {
      await deleteFile(savedFile.storageKey).catch(() => undefined);
    }
    throw error;
  }
}
