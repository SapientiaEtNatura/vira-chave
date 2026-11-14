import { describe, expect, it, vi } from "vitest";
import {
  SEED_CHALLENGES,
  SEED_MACRO_AREAS,
  SEED_QUESTIONS,
  SEED_TRACKS,
} from "@/lib/seed-data";
import { seedDatabase } from "../../prisma/seed";

describe("Schema & Seed Integrity", () => {
  it("contains at least 6 MacroAreas, 15 DiscoveryQuestions, 3 Tracks, and 3 Challenges", () => {
    expect(SEED_MACRO_AREAS.length).toBeGreaterThanOrEqual(6);
    expect(SEED_QUESTIONS.length).toBeGreaterThanOrEqual(15);
    expect(SEED_TRACKS.length).toBeGreaterThanOrEqual(3);
    expect(SEED_CHALLENGES.length).toBeGreaterThanOrEqual(3);

    const macroAreaIds = new Set(SEED_MACRO_AREAS.map((area) => area.id));
    expect(macroAreaIds.size).toBe(SEED_MACRO_AREAS.length);

    for (const track of SEED_TRACKS) {
      expect(macroAreaIds.has(track.macroAreaId)).toBe(true);
      expect(track.courses.length).toBeGreaterThanOrEqual(1);
    }

    for (const challenge of SEED_CHALLENGES) {
      expect(macroAreaIds.has(challenge.macroAreaId)).toBe(true);
    }
  });

  it("runs seedDatabase idempotently with a mocked PrismaClient", async () => {
    const mockPrisma = {
      macroArea: { upsert: vi.fn().mockResolvedValue({}) },
      discoveryQuestion: { upsert: vi.fn().mockResolvedValue({}) },
      track: { upsert: vi.fn().mockResolvedValue({}) },
      courseItem: { upsert: vi.fn().mockResolvedValue({}) },
      challenge: { upsert: vi.fn().mockResolvedValue({}) },
      institution: { upsert: vi.fn().mockResolvedValue({}) },
      user: { upsert: vi.fn().mockResolvedValue({}) },
      classroom: { upsert: vi.fn().mockResolvedValue({}) },
    };

    await seedDatabase(mockPrisma as never);
    await seedDatabase(mockPrisma as never);

    expect(mockPrisma.macroArea.upsert).toHaveBeenCalledTimes(
      SEED_MACRO_AREAS.length * 2,
    );
    expect(mockPrisma.discoveryQuestion.upsert).toHaveBeenCalledTimes(
      SEED_QUESTIONS.length * 2,
    );
    expect(mockPrisma.track.upsert).toHaveBeenCalledTimes(
      SEED_TRACKS.length * 2,
    );
    const totalCourses = SEED_TRACKS.reduce(
      (sum, track) => sum + track.courses.length,
      0,
    );
    expect(mockPrisma.courseItem.upsert).toHaveBeenCalledTimes(
      totalCourses * 2,
    );
    expect(mockPrisma.challenge.upsert).toHaveBeenCalledTimes(
      SEED_CHALLENGES.length * 2,
    );
  });
});
