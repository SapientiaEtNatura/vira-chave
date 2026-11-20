import type { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  LEGACY_SEED_QUESTION_IDS,
  SEED_CHALLENGES,
  SEED_MACRO_AREAS,
  SEED_QUESTIONS,
  SEED_TRACKS,
} from "../src/lib/seed-data";

export async function seedDevFixtures(client: PrismaClient): Promise<void> {
  const [adminHash, educatorHash, studentHash] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Educador123!", 10),
    bcrypt.hash("Aluno123!", 10),
  ]);

  const institution = await client.institution.upsert({
    where: { institutionCode: "PILOTO01" },
    update: { active: true },
    create: {
      name: "Escola Piloto Vira Chave",
      institutionCode: "PILOTO01",
      active: true,
    },
  });

  await client.user.upsert({
    where: { email: "admin@virachave.local" },
    update: { status: "ACTIVE" },
    create: {
      name: "Admin Vira Chave",
      email: "admin@virachave.local",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const educator = await client.user.upsert({
    where: { email: "educador@virachave.local" },
    update: { status: "ACTIVE", institutionId: institution.id },
    create: {
      name: "Educador Piloto",
      email: "educador@virachave.local",
      passwordHash: educatorHash,
      role: "EDUCADOR",
      institutionId: institution.id,
      status: "ACTIVE",
    },
  });

  const student = await client.user.upsert({
    where: { email: "aluno@virachave.local" },
    update: { status: "ACTIVE", institutionId: institution.id },
    create: {
      name: "Estudante Piloto",
      email: "aluno@virachave.local",
      passwordHash: studentHash,
      role: "ESTUDANTE",
      institutionId: institution.id,
      status: "ACTIVE",
    },
  });

  const classroom = await client.classroom.upsert({
    where: { inviteCode: "TURMA01" },
    update: { active: true },
    create: {
      name: "Turma Piloto 1A",
      inviteCode: "TURMA01",
      active: true,
      institutionId: institution.id,
      educatorId: educator.id,
    },
  });

  if (client.classroomEnrollment?.upsert) {
    await client.classroomEnrollment.upsert({
      where: {
        classroomId_studentId: {
          classroomId: classroom.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        classroomId: classroom.id,
        studentId: student.id,
      },
    });
  }
}

export async function seedDatabase(client: PrismaClient): Promise<void> {
  for (const area of SEED_MACRO_AREAS) {
    await client.macroArea.upsert({
      where: { id: area.id },
      update: {
        name: area.name,
        slug: area.slug,
        description: area.description,
        entryRoles: area.entryRoles,
      },
      create: {
        id: area.id,
        name: area.name,
        slug: area.slug,
        description: area.description,
        entryRoles: area.entryRoles,
      },
    });
  }

  for (const question of SEED_QUESTIONS) {
    const optionsJson = question.options as unknown as Prisma.InputJsonValue;
    await client.discoveryQuestion.upsert({
      where: { id: question.id },
      update: {
        order: question.order,
        prompt: question.prompt,
        weightsByArea: question.weightsByArea,
        optionsJson,
      },
      create: {
        id: question.id,
        order: question.order,
        prompt: question.prompt,
        weightsByArea: question.weightsByArea,
        optionsJson,
      },
    });
  }

  if (client.discoveryQuestion?.deleteMany) {
    await client.discoveryQuestion.deleteMany({
      where: {
        id: { in: [...LEGACY_SEED_QUESTION_IDS] },
      },
    });
  }

  for (const track of SEED_TRACKS) {
    await client.track.upsert({
      where: { id: track.id },
      update: {
        macroAreaId: track.macroAreaId,
        title: track.title,
        description: track.description,
        published: track.published,
      },
      create: {
        id: track.id,
        macroAreaId: track.macroAreaId,
        title: track.title,
        description: track.description,
        published: track.published,
      },
    });

    for (const course of track.courses) {
      await client.courseItem.upsert({
        where: { id: course.id },
        update: {
          trackId: track.id,
          title: course.title,
          providerName: course.providerName,
          externalUrl: course.externalUrl,
          order: course.order,
        },
        create: {
          id: course.id,
          trackId: track.id,
          title: course.title,
          providerName: course.providerName,
          externalUrl: course.externalUrl,
          order: course.order,
        },
      });
    }
  }

  for (const challenge of SEED_CHALLENGES) {
    await client.challenge.upsert({
      where: { id: challenge.id },
      update: {
        macroAreaId: challenge.macroAreaId,
        title: challenge.title,
        description: challenge.description,
        published: challenge.published,
      },
      create: {
        id: challenge.id,
        macroAreaId: challenge.macroAreaId,
        title: challenge.title,
        description: challenge.description,
        published: challenge.published,
      },
    });
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEED_DEV_USERS === "true"
  ) {
    throw new Error("SEED_DEV_USERS não pode ser executado em produção.");
  }

  // Semeia instituição, turma e usuários locais apenas em desenvolvimento com opt-in explícito
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SEED_DEV_USERS === "true"
  ) {
    await seedDevFixtures(client);
  }
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma);
    console.log("Seed completed successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

const entryFile = process.argv[1] ?? "";
if (entryFile.endsWith("seed.ts") || entryFile.endsWith("seed.js")) {
  main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
