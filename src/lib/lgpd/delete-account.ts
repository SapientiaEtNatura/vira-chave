import crypto from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { ConsentType, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export class AccountDeletionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccountDeletionError";
    this.status = status;
  }
}

export type RemoveFileFn = (storageKey: string) => Promise<void>;

export interface DeleteAccountResult {
  deletedUserId: string;
  anonymizedRef: string;
  removedFilesCount: number;
}

export async function defaultRemoveFile(storageKey: string): Promise<void> {
  const uploadDir = path.resolve(
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
  );
  const targetPath = path.resolve(uploadDir, storageKey);

  if (!targetPath.startsWith(`${uploadDir}${path.sep}`)) {
    throw new Error("Caminho de arquivo inválido.");
  }

  try {
    await unlink(targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteStudentAccount(
  userId: string,
  prismaClient: PrismaClient = prisma,
  removeFileFn: RemoveFileFn = defaultRemoveFile,
): Promise<DeleteAccountResult> {
  const anonymizedRef = `anon_${crypto
    .createHash("sha256")
    .update(userId)
    .digest("hex")
    .slice(0, 24)}`;

  const evidenceFiles = await prismaClient.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AccountDeletionError("Conta não encontrada.", 404);
    }

    const files = await tx.evidenceFile.findMany({
      where: { project: { studentId: userId } },
      select: { id: true, storageKey: true },
    });

    await tx.consentRecord.updateMany({
      where: { userId },
      data: {
        userId: null,
        anonymizedRef,
      },
    });

    await tx.consentRecord.create({
      data: {
        userId: null,
        anonymizedRef,
        type: ConsentType.EXCLUSAO_CONTA,
        version: "1.0",
      },
    });

    await tx.evidenceFile.deleteMany({
      where: { project: { studentId: userId } },
    });
    await tx.portfolioProject.deleteMany({
      where: { studentId: userId },
    });
    await tx.portfolioShareLink.deleteMany({
      where: { studentId: userId },
    });
    await tx.discoveryResult.deleteMany({
      where: { studentId: userId },
    });
    await tx.courseProgress.deleteMany({
      where: { studentId: userId },
    });
    await tx.classroomEnrollment.deleteMany({
      where: { studentId: userId },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId },
    });
    await tx.user.delete({
      where: { id: userId },
    });

    return files;
  });

  let removedFilesCount = 0;
  for (const file of evidenceFiles) {
    try {
      await removeFileFn(file.storageKey);
      removedFilesCount += 1;
    } catch {
      // File cleanup failure should not block completed DB purge
    }
  }

  return {
    deletedUserId: userId,
    anonymizedRef,
    removedFilesCount,
  };
}
