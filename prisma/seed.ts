import type { PrismaClient } from "@prisma/client";
import {
  SEED_CHALLENGES,
  SEED_MACRO_AREAS,
  SEED_QUESTIONS,
  SEED_TRACKS,
} from "../src/lib/seed-data";

export async function seedDatabase(client: PrismaClient): Promise<void> {
  for (const area of SEED_MACRO_AREAS) {
    await client.macroArea.upsert({
      where: { id: area.id },
      update: {
        name: area.name,
        slug: area.slug,
        description: area.description,
      },
      create: {
        id: area.id,
        name: area.name,
        slug: area.slug,
        description: area.description,
      },
    });
  }

  for (const question of SEED_QUESTIONS) {
    await client.discoveryQuestion.upsert({
      where: { id: question.id },
      update: {
        order: question.order,
        prompt: question.prompt,
        weightsByArea: question.weightsByArea,
      },
      create: {
        id: question.id,
        order: question.order,
        prompt: question.prompt,
        weightsByArea: question.weightsByArea,
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
