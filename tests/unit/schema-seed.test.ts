import { describe, expect, it, vi } from "vitest";
import {
  deriveQuestionAreaWeights,
  parseQuestionOptions,
  parseSelfPracticeMap,
} from "@/lib/discovery/types";
import {
  LEGACY_SEED_QUESTION_IDS,
  SEED_CHALLENGES,
  SEED_MACRO_AREAS,
  SEED_QUESTIONS,
  SEED_TRACKS,
} from "@/lib/seed-data";
import { seedDatabase } from "../../prisma/seed";

describe("Discovery Types & Normalizers", () => {
  it("parses valid options and ignores malformed payloads", () => {
    expect(parseQuestionOptions(null)).toEqual([]);
    expect(parseQuestionOptions("invalid")).toEqual([]);
    expect(
      parseQuestionOptions([
        null,
        { id: "", label: "Sem id", weightsByArea: { "tecnologia-dados": 3 } },
        { id: "a", label: " ", weightsByArea: { "tecnologia-dados": 3 } },
        { id: "b", label: "Sem pesos", weightsByArea: {} },
        {
          id: "c",
          label: "Organizar os dados em planilha",
          weightsByArea: {
            "tecnologia-dados": 3,
            "negocios-empreendedorismo": 1,
            invalido: -2,
            zero: 0,
            nan: Number.NaN,
          },
        },
      ]),
    ).toEqual([
      {
        id: "c",
        label: "Organizar os dados em planilha",
        weightsByArea: {
          "tecnologia-dados": 3,
          "negocios-empreendedorismo": 1,
        },
      },
    ]);
  });

  it("derives question area weights using the highest weight per area across options", () => {
    const weights = deriveQuestionAreaWeights([
      {
        id: "a",
        label: "Opção A",
        weightsByArea: { "tecnologia-dados": 3, "design-criacao": 1 },
      },
      {
        id: "b",
        label: "Opção B",
        weightsByArea: { "design-criacao": 3, "tecnologia-dados": 2 },
      },
      {
        id: "c",
        label: "Opção C",
        weightsByArea: { "comunicacao-conteudo": 3 },
      },
    ]);

    expect(weights).toEqual({
      "tecnologia-dados": 3,
      "design-criacao": 3,
      "comunicacao-conteudo": 3,
    });
  });

  it("parses selfPracticeJson defensively into 0 | 1 | 2 map or null", () => {
    expect(parseSelfPracticeMap(null)).toBeNull();
    expect(parseSelfPracticeMap(undefined)).toBeNull();
    expect(parseSelfPracticeMap([])).toBeNull();
    expect(parseSelfPracticeMap({ "tecnologia-dados": 5 })).toBeNull();

    expect(
      parseSelfPracticeMap({
        "tecnologia-dados": 2,
        "design-criacao": 1,
        "saude-bem-estar": 0,
        invalido: 3,
        outro: -1,
        texto: "1",
      }),
    ).toEqual({
      "tecnologia-dados": 2,
      "design-criacao": 1,
      "saude-bem-estar": 0,
    });
  });

  it("ignores prototype-polluting keys (__proto__, constructor, prototype) in discovery normalizers", () => {
    const rawOptions = JSON.parse(
      `[{"id":"a","label":"Cenário seguro","weightsByArea":{"__proto__":3,"constructor":2,"prototype":4,"tecnologia-dados":3}}]`,
    );

    const parsedOptions = parseQuestionOptions(rawOptions);
    expect(parsedOptions).toEqual([
      {
        id: "a",
        label: "Cenário seguro",
        weightsByArea: { "tecnologia-dados": 3 },
      },
    ]);
    expect(Object.hasOwn(parsedOptions[0].weightsByArea, "__proto__")).toBe(false);
    expect(Object.hasOwn(parsedOptions[0].weightsByArea, "constructor")).toBe(false);
    expect(Object.hasOwn(parsedOptions[0].weightsByArea, "prototype")).toBe(false);

    const unsafeOption = {
      id: "b",
      label: "Com chave insegura direta",
      weightsByArea: JSON.parse(
        `{"__proto__":3,"constructor":4,"prototype":2,"design-criacao":2}`,
      ),
    };
    const derived = deriveQuestionAreaWeights([unsafeOption]);
    expect(derived).toEqual({ "design-criacao": 2 });
    expect(Number.isNaN(derived["__proto__"] as number)).toBe(false);
    expect(Object.hasOwn(derived, "__proto__")).toBe(false);
    expect(Object.hasOwn(derived, "constructor")).toBe(false);
    expect(Object.hasOwn(derived, "prototype")).toBe(false);

    const rawSelfPractice = JSON.parse(
      `{"__proto__":2,"constructor":1,"prototype":0,"tecnologia-dados":1}`,
    );
    const parsedPractice = parseSelfPracticeMap(rawSelfPractice);
    expect(parsedPractice).toEqual({ "tecnologia-dados": 1 });
    expect(Object.hasOwn(parsedPractice!, "__proto__")).toBe(false);
    expect(Object.hasOwn(parsedPractice!, "constructor")).toBe(false);
    expect(Object.hasOwn(parsedPractice!, "prototype")).toBe(false);
  });
});

describe("Schema & Seed Integrity", () => {
  it("contains 6 MacroAreas with entryRoles, full track/challenge coverage, and 10 balanced situational questions", () => {
    expect(SEED_MACRO_AREAS).toHaveLength(6);
    expect(SEED_QUESTIONS).toHaveLength(10);
    expect(SEED_TRACKS).toHaveLength(6);
    expect(SEED_CHALLENGES).toHaveLength(6);
    expect(LEGACY_SEED_QUESTION_IDS).toEqual([
      "q-11",
      "q-12",
      "q-13",
      "q-14",
      "q-15",
    ]);

    const macroAreaIds = new Set(SEED_MACRO_AREAS.map((area) => area.id));
    const macroAreaSlugs = new Set(SEED_MACRO_AREAS.map((area) => area.slug));
    expect(macroAreaIds.size).toBe(6);
    expect(macroAreaSlugs.size).toBe(6);

    for (const area of SEED_MACRO_AREAS) {
      expect(area.entryRoles.length).toBeGreaterThanOrEqual(3);
      expect(area.entryRoles.length).toBeLessThanOrEqual(5);
      for (const role of area.entryRoles) {
        expect(role.trim().length).toBeGreaterThan(0);
      }

      const publishedTracks = SEED_TRACKS.filter(
        (t) => t.macroAreaId === area.id && t.published,
      );
      expect(publishedTracks.length).toBeGreaterThanOrEqual(1);

      const publishedChallenges = SEED_CHALLENGES.filter(
        (c) => c.macroAreaId === area.id && c.published,
      );
      expect(publishedChallenges.length).toBeGreaterThanOrEqual(1);
    }

    for (const track of SEED_TRACKS) {
      expect(macroAreaIds.has(track.macroAreaId)).toBe(true);
      expect(track.courses.length).toBeGreaterThanOrEqual(2);
      for (const course of track.courses) {
        expect(course.externalUrl).toMatch(/^https:\/\//);
      }
    }

    for (const challenge of SEED_CHALLENGES) {
      expect(macroAreaIds.has(challenge.macroAreaId)).toBe(true);
    }

    const mainAppearanceCount = Object.fromEntries(
      SEED_MACRO_AREAS.map((area) => [area.slug, 0]),
    );

    for (const question of SEED_QUESTIONS) {
      expect(question.options).toHaveLength(4);
      const optionIds = new Set(question.options.map((opt) => opt.id));
      expect(optionIds.size).toBe(4);
      expect(question.weightsByArea).toEqual(
        deriveQuestionAreaWeights(question.options),
      );

      for (const option of question.options) {
        expect(option.label.trim().length).toBeGreaterThan(0);
        const entries = Object.entries(option.weightsByArea);
        expect(entries.length).toBeGreaterThanOrEqual(1);

        let hasPositiveKnownWeight = false;
        for (const [slug, weight] of entries) {
          expect(macroAreaSlugs.has(slug)).toBe(true);
          if (weight > 0) hasPositiveKnownWeight = true;
          if (weight >= 3) {
            mainAppearanceCount[slug] += 1;
          }
        }
        expect(hasPositiveKnownWeight).toBe(true);
      }
    }

    for (const area of SEED_MACRO_AREAS) {
      expect(mainAppearanceCount[area.slug]).toBeGreaterThanOrEqual(6);
      expect(mainAppearanceCount[area.slug]).toBeLessThanOrEqual(7);
    }
  });

  it("runs seedDatabase idempotently with a mocked PrismaClient and cleans up legacy question ids", async () => {
    const mockPrisma = {
      macroArea: { upsert: vi.fn().mockResolvedValue({}) },
      discoveryQuestion: {
        upsert: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      track: { upsert: vi.fn().mockResolvedValue({}) },
      courseItem: { upsert: vi.fn().mockResolvedValue({}) },
      challenge: { upsert: vi.fn().mockResolvedValue({}) },
      institution: { upsert: vi.fn().mockResolvedValue({ id: "inst-1" }) },
      user: { upsert: vi.fn().mockResolvedValue({ id: "user-1" }) },
      classroom: { upsert: vi.fn().mockResolvedValue({ id: "class-1" }) },
      classroomEnrollment: { upsert: vi.fn().mockResolvedValue({}) },
    };

    await seedDatabase(mockPrisma as never);
    await seedDatabase(mockPrisma as never);

    expect(mockPrisma.macroArea.upsert).toHaveBeenCalledTimes(
      SEED_MACRO_AREAS.length * 2,
    );
    expect(mockPrisma.macroArea.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          entryRoles: SEED_MACRO_AREAS[0].entryRoles,
        }),
        create: expect.objectContaining({
          entryRoles: SEED_MACRO_AREAS[0].entryRoles,
        }),
      }),
    );

    expect(mockPrisma.discoveryQuestion.upsert).toHaveBeenCalledTimes(
      SEED_QUESTIONS.length * 2,
    );
    expect(mockPrisma.discoveryQuestion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          optionsJson: SEED_QUESTIONS[0].options,
          weightsByArea: SEED_QUESTIONS[0].weightsByArea,
        }),
        create: expect.objectContaining({
          optionsJson: SEED_QUESTIONS[0].options,
          weightsByArea: SEED_QUESTIONS[0].weightsByArea,
        }),
      }),
    );

    expect(mockPrisma.discoveryQuestion.deleteMany).toHaveBeenCalledTimes(2);
    expect(mockPrisma.discoveryQuestion.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: [...LEGACY_SEED_QUESTION_IDS] },
      },
    });

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
