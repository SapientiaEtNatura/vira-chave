import bcrypt from "bcryptjs";
import { ConsentType, PrismaClient, Role } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export const CONSENT_VERSION = "1.0";

export class RegistrationError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "REGISTRATION_ERROR") {
    super(message);
    this.name = "RegistrationError";
    this.status = status;
    this.code = code;
  }
}

export interface RegisteredUserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  institutionId: string | null;
}

export async function registerUser(
  rawInput: RegisterInput,
  prismaClient: PrismaClient = defaultPrisma,
): Promise<RegisteredUserSummary> {
  const validation = registerSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    throw new RegistrationError(
      firstIssue?.message ?? "Dados de cadastro inválidos.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const input = validation.data;
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prismaClient.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw new RegistrationError(
        "Já existe uma conta cadastrada com este e-mail.",
        409,
        "EMAIL_IN_USE",
      );
    }

    if (input.role === "ESTUDANTE") {
      const classroom = await tx.classroom.findUnique({
        where: { inviteCode: input.inviteCode },
        include: {
          institution: {
            select: { id: true, active: true },
          },
        },
      });

      if (!classroom || !classroom.active || !classroom.institution.active) {
        throw new RegistrationError(
          "Código de turma inválido ou inativo.",
          400,
          "INVALID_INVITE_CODE",
        );
      }

      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: Role.ESTUDANTE,
          institutionId: classroom.institutionId,
          status: "ACTIVE",
        },
      });

      await tx.classroomEnrollment.create({
        data: {
          classroomId: classroom.id,
          studentId: user.id,
        },
      });

      await tx.consentRecord.createMany({
        data: [
          {
            userId: user.id,
            type: ConsentType.TERMOS_USO,
            version: CONSENT_VERSION,
          },
          {
            userId: user.id,
            type: ConsentType.PRIVACIDADE,
            version: CONSENT_VERSION,
          },
          {
            userId: user.id,
            type: ConsentType.VINCULO_ESCOLAR,
            version: CONSENT_VERSION,
          },
        ],
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      };
    }

    const institution = await tx.institution.findUnique({
      where: { institutionCode: input.institutionCode },
      select: { id: true, active: true },
    });

    if (!institution || !institution.active) {
      throw new RegistrationError(
        "Código de instituição inválido ou inativo.",
        400,
        "INVALID_INSTITUTION_CODE",
      );
    }

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: Role.EDUCADOR,
        institutionId: institution.id,
        status: "ACTIVE",
      },
    });

    await tx.consentRecord.createMany({
      data: [
        {
          userId: user.id,
          type: ConsentType.TERMOS_USO,
          version: CONSENT_VERSION,
        },
        {
          userId: user.id,
          type: ConsentType.PRIVACIDADE,
          version: CONSENT_VERSION,
        },
        {
          userId: user.id,
          type: ConsentType.SIGILO_EDUCADOR,
          version: CONSENT_VERSION,
        },
      ],
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };
  });
}
