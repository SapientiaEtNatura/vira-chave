import { describe, expect, it, vi } from "vitest";
import { Role, ConsentType } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

import { registerUser, RegistrationError } from "@/lib/auth/register";
import { checkRoleAccess } from "@/lib/rbac";
import { registerSchema } from "@/lib/validations/auth";

function createMockPrisma(overrides?: {
  existingUser?: { id: string } | null;
  classroom?: {
    id: string;
    institutionId: string;
    active: boolean;
    institution: { id: string; active: boolean };
  } | null;
  institution?: { id: string; active: boolean } | null;
}) {
  const userCreate = vi.fn().mockResolvedValue({
    id: "user-1",
    name: "Ana Silva",
    email: "ana@escola.br",
    role: Role.ESTUDANTE,
    institutionId: "inst-1",
  });
  const enrollmentCreate = vi.fn().mockResolvedValue({ id: "enr-1" });
  const consentCreateMany = vi.fn().mockResolvedValue({ count: 3 });

  const tx = {
    user: {
      findUnique: vi.fn().mockResolvedValue(overrides?.existingUser ?? null),
      create: userCreate,
    },
    classroom: {
      findUnique: vi.fn().mockResolvedValue(overrides?.classroom ?? null),
    },
    institution: {
      findUnique: vi.fn().mockResolvedValue(overrides?.institution ?? null),
    },
    classroomEnrollment: {
      create: enrollmentCreate,
    },
    consentRecord: {
      createMany: consentCreateMany,
    },
  };

  const prismaMock = {
    ...tx,
    $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  return { prismaMock, tx, userCreate, enrollmentCreate, consentCreateMany };
}

describe("Auth registration & RBAC", () => {
  it("test_student_signup_requires_active_classroom_invite_code", async () => {
    const baseInput = {
      name: "Ana Silva",
      email: "ana@escola.br",
      password: "Password123!",
      role: "ESTUDANTE" as const,
      inviteCode: "TURMA-INVALIDA",
      acceptedTerms: true as const,
      acceptedPrivacy: true as const,
    };

    // 1. Non-existent invite code -> rejects without creating User
    const mockMissing = createMockPrisma({ classroom: null });
    await expect(
      registerUser(baseInput, mockMissing.prismaMock as never),
    ).rejects.toThrow(RegistrationError);
    expect(mockMissing.userCreate).not.toHaveBeenCalled();

    // 2. Inactive classroom -> rejects without creating User
    const mockInactiveClassroom = createMockPrisma({
      classroom: {
        id: "cls-1",
        institutionId: "inst-1",
        active: false,
        institution: { id: "inst-1", active: true },
      },
    });
    await expect(
      registerUser(baseInput, mockInactiveClassroom.prismaMock as never),
    ).rejects.toThrow(RegistrationError);
    expect(mockInactiveClassroom.userCreate).not.toHaveBeenCalled();

    // 3. Inactive institution -> rejects without creating User
    const mockInactiveInst = createMockPrisma({
      classroom: {
        id: "cls-1",
        institutionId: "inst-1",
        active: true,
        institution: { id: "inst-1", active: false },
      },
    });
    await expect(
      registerUser(baseInput, mockInactiveInst.prismaMock as never),
    ).rejects.toThrow(RegistrationError);
    expect(mockInactiveInst.userCreate).not.toHaveBeenCalled();

    // 4. Valid active classroom & institution -> creates User, Enrollment, and 3 ConsentRecords
    const mockValid = createMockPrisma({
      classroom: {
        id: "cls-1",
        institutionId: "inst-1",
        active: true,
        institution: { id: "inst-1", active: true },
      },
    });
    const result = await registerUser(
      { ...baseInput, inviteCode: "TURMA-2026" },
      mockValid.prismaMock as never,
    );

    expect(result.role).toBe(Role.ESTUDANTE);
    expect(mockValid.userCreate).toHaveBeenCalledTimes(1);
    expect(mockValid.enrollmentCreate).toHaveBeenCalledWith({
      data: {
        classroomId: "cls-1",
        studentId: "user-1",
      },
    });
    expect(mockValid.consentCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ type: ConsentType.TERMOS_USO, version: "1.0" }),
        expect.objectContaining({ type: ConsentType.PRIVACIDADE, version: "1.0" }),
        expect.objectContaining({ type: ConsentType.VINCULO_ESCOLAR, version: "1.0" }),
      ]),
    });
  });

  it("test_educator_signup_requires_active_institution_code_and_sigilo_consent", async () => {
    const baseInput = {
      name: "Prof. Carlos",
      email: "carlos@escola.br",
      password: "Password123!",
      role: "EDUCADOR" as const,
      institutionCode: "INST-2026",
      acceptedTerms: true as const,
      acceptedPrivacy: true as const,
      acceptedSigilo: true as const,
    };

    // 1. Missing sigilo consent fails schema validation
    const parsedNoSigilo = registerSchema.safeParse({
      ...baseInput,
      acceptedSigilo: false,
    });
    expect(parsedNoSigilo.success).toBe(false);

    // 2. ADMIN role is rejected by public signup schema
    const parsedAdmin = registerSchema.safeParse({
      ...baseInput,
      role: "ADMIN",
    });
    expect(parsedAdmin.success).toBe(false);

    // 3. Inactive or missing institution -> rejects without creating User
    const mockInactiveInst = createMockPrisma({
      institution: { id: "inst-1", active: false },
    });
    await expect(
      registerUser(baseInput, mockInactiveInst.prismaMock as never),
    ).rejects.toThrow(RegistrationError);
    expect(mockInactiveInst.userCreate).not.toHaveBeenCalled();

    // 4. Valid active institution + sigilo -> links institutionId and records SIGILO_EDUCADOR
    const mockValid = createMockPrisma({
      institution: { id: "inst-1", active: true },
    });
    mockValid.userCreate.mockResolvedValueOnce({
      id: "edu-1",
      name: "Prof. Carlos",
      email: "carlos@escola.br",
      role: Role.EDUCADOR,
      institutionId: "inst-1",
    });

    const result = await registerUser(baseInput, mockValid.prismaMock as never);
    expect(result.institutionId).toBe("inst-1");
    expect(mockValid.userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: Role.EDUCADOR,
        institutionId: "inst-1",
      }),
    });
    expect(mockValid.consentCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ type: ConsentType.TERMOS_USO, version: "1.0" }),
        expect.objectContaining({ type: ConsentType.PRIVACIDADE, version: "1.0" }),
        expect.objectContaining({ type: ConsentType.SIGILO_EDUCADOR, version: "1.0" }),
      ]),
    });
  });

  it("test_require_role_blocks_unauthorized_profile", () => {
    // Unauthenticated -> 401
    const unauth = checkRoleAccess(null, [Role.ESTUDANTE]);
    expect(unauth).toEqual({
      authorized: false,
      status: 401,
      error: expect.any(String),
    });

    // Wrong role -> 403
    const forbidden = checkRoleAccess(
      {
        user: {
          id: "u-1",
          role: Role.ESTUDANTE,
          institutionId: "inst-1",
          email: "ana@escola.br",
          name: "Ana",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      [Role.EDUCADOR, Role.ADMIN],
    );
    expect(forbidden).toEqual({
      authorized: false,
      status: 403,
      error: expect.any(String),
    });

    // Allowed role -> authorized
    const allowed = checkRoleAccess(
      {
        user: {
          id: "u-2",
          role: Role.EDUCADOR,
          institutionId: "inst-1",
          email: "carlos@escola.br",
          name: "Carlos",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      [Role.EDUCADOR],
    );
    expect(allowed).toEqual({
      authorized: true,
      user: {
        userId: "u-2",
        role: Role.EDUCADOR,
        institutionId: "inst-1",
      },
    });
  });
});
