import { describe, expect, it, vi } from "vitest";
import { ConsentType } from "@prisma/client";
import { deleteStudentAccount } from "@/lib/lgpd/delete-account";

function createMockPrisma(overrides?: {
  user?: { id: string; role: string } | null;
  evidenceFiles?: Array<{ id: string; storageKey: string }>;
}) {
  const userFindUnique = vi.fn().mockResolvedValue(
    overrides && "user" in overrides
      ? overrides.user
      : { id: "student-1", role: "ESTUDANTE" },
  );
  const userDelete = vi.fn().mockResolvedValue({ id: "student-1" });

  const evidenceFindMany = vi.fn().mockResolvedValue(
    overrides?.evidenceFiles ?? [
      { id: "ev-1", storageKey: "student-1/projeto-1/foto.png" },
      { id: "ev-2", storageKey: "student-1/projeto-2/relatorio.pdf" },
    ],
  );
  const evidenceDeleteMany = vi.fn().mockResolvedValue({ count: 2 });
  const portfolioProjectDeleteMany = vi.fn().mockResolvedValue({ count: 2 });
  const portfolioShareLinkDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const discoveryResultDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const courseProgressDeleteMany = vi.fn().mockResolvedValue({ count: 3 });
  const classroomEnrollmentDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const passwordResetTokenDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const consentUpdateMany = vi.fn().mockResolvedValue({ count: 3 });
  const consentCreate = vi.fn().mockResolvedValue({
    id: "consent-del-1",
    userId: null,
    anonymizedRef: "anon-ref",
    type: ConsentType.EXCLUSAO_CONTA,
    version: "1.0",
  });

  const tx = {
    user: {
      findUnique: userFindUnique,
      delete: userDelete,
    },
    evidenceFile: {
      findMany: evidenceFindMany,
      deleteMany: evidenceDeleteMany,
    },
    portfolioProject: {
      deleteMany: portfolioProjectDeleteMany,
    },
    portfolioShareLink: {
      deleteMany: portfolioShareLinkDeleteMany,
    },
    discoveryResult: {
      deleteMany: discoveryResultDeleteMany,
    },
    courseProgress: {
      deleteMany: courseProgressDeleteMany,
    },
    classroomEnrollment: {
      deleteMany: classroomEnrollmentDeleteMany,
    },
    passwordResetToken: {
      deleteMany: passwordResetTokenDeleteMany,
    },
    consentRecord: {
      updateMany: consentUpdateMany,
      create: consentCreate,
    },
  };

  const prismaMock = {
    ...tx,
    $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) =>
      cb(tx),
    ),
  };

  return {
    prismaMock,
    userDelete,
    evidenceDeleteMany,
    portfolioProjectDeleteMany,
    portfolioShareLinkDeleteMany,
    discoveryResultDeleteMany,
    courseProgressDeleteMany,
    classroomEnrollmentDeleteMany,
    passwordResetTokenDeleteMany,
    consentUpdateMany,
    consentCreate,
  };
}

describe("LGPD account deletion", () => {
  it("test_delete_account_purges_user_and_files_keeping_anonymized_consent", async () => {
    const mocks = createMockPrisma();
    const removeFileFn = vi.fn().mockResolvedValue(undefined);

    const result = await deleteStudentAccount(
      "student-1",
      mocks.prismaMock as never,
      removeFileFn,
    );

    expect(result.deletedUserId).toBe("student-1");
    expect(result.removedFilesCount).toBe(2);
    expect(result.anonymizedRef).toBeTruthy();

    // Existing consents are anonymized (userId = null) with the same anonymizedRef
    expect(mocks.consentUpdateMany).toHaveBeenCalledWith({
      where: { userId: "student-1" },
      data: {
        userId: null,
        anonymizedRef: result.anonymizedRef,
      },
    });

    // New EXCLUSAO_CONTA consent record is created with userId: null
    expect(mocks.consentCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        anonymizedRef: result.anonymizedRef,
        type: ConsentType.EXCLUSAO_CONTA,
        version: "1.0",
      },
    });

    // Student-owned records are purged
    expect(mocks.evidenceDeleteMany).toHaveBeenCalledWith({
      where: { project: { studentId: "student-1" } },
    });
    expect(mocks.portfolioProjectDeleteMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
    });
    expect(mocks.portfolioShareLinkDeleteMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
    });
    expect(mocks.discoveryResultDeleteMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
    });
    expect(mocks.courseProgressDeleteMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
    });
    expect(mocks.classroomEnrollmentDeleteMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
    });
    expect(mocks.passwordResetTokenDeleteMany).toHaveBeenCalledWith({
      where: { userId: "student-1" },
    });

    // User record is deleted
    expect(mocks.userDelete).toHaveBeenCalledWith({
      where: { id: "student-1" },
    });

    // Physical files are removed for each EvidenceFile
    expect(removeFileFn).toHaveBeenCalledTimes(2);
    expect(removeFileFn).toHaveBeenCalledWith("student-1/projeto-1/foto.png");
    expect(removeFileFn).toHaveBeenCalledWith(
      "student-1/projeto-2/relatorio.pdf",
    );
  });

  it("throws when user does not exist", async () => {
    const mocks = createMockPrisma({ user: null });
    const removeFileFn = vi.fn();

    await expect(
      deleteStudentAccount(
        "missing-user",
        mocks.prismaMock as never,
        removeFileFn,
      ),
    ).rejects.toThrow("Conta não encontrada.");

    expect(mocks.userDelete).not.toHaveBeenCalled();
    expect(removeFileFn).not.toHaveBeenCalled();
  });
});
