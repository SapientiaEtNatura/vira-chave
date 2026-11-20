import { describe, expect, it, vi } from "vitest";
import {
  calculateSituationalAffinityScores,
  type SituationalQuestion,
} from "@/lib/discovery/scoring";
import {
  buildDiscoveryComparison,
  calculateProvenPractice,
  resolveAreaReadinessStatus,
  resolvePublicReadinessStatus,
} from "@/lib/discovery/readiness";
import { getStudentProvenPractice } from "@/lib/discovery/readiness-server";
import {
  computeStudentStage,
  resolveStageFromMilestones,
} from "@/lib/student/stage";

describe("Student journey stage computation", () => {
  it("test_compute_student_stage_follows_highest_milestone", async () => {
    expect(
      resolveStageFromMilestones({
        portfolioCount: 0,
        challengeSubmissionCount: 0,
        activeCourseCount: 0,
      }),
    ).toBe("DESCOBRIR");

    expect(
      resolveStageFromMilestones({
        portfolioCount: 0,
        challengeSubmissionCount: 0,
        activeCourseCount: 1,
      }),
    ).toBe("APRENDER");

    expect(
      resolveStageFromMilestones({
        portfolioCount: 0,
        challengeSubmissionCount: 2,
        activeCourseCount: 3,
      }),
    ).toBe("EXPERIMENTAR");

    expect(
      resolveStageFromMilestones({
        portfolioCount: 1,
        challengeSubmissionCount: 2,
        activeCourseCount: 3,
      }),
    ).toBe("CONSTRUIR");

    expect(
      resolveStageFromMilestones({
        portfolioCount: 0,
        challengeSubmissionCount: 0,
        activeCourseCount: 0,
        hasDiscovery: true,
      }),
    ).toBe("APRENDER");

    expect(
      resolveStageFromMilestones({
        portfolioCount: 0,
        challengeSubmissionCount: 1,
        activeCourseCount: 1,
        hasActiveShareLink: true,
      }),
    ).toBe("CONSTRUIR");

    const mockPrisma = {
      portfolioProject: {
        count: vi
          .fn()
          .mockResolvedValueOnce(0) // portfolioCount (challengeId: null)
          .mockResolvedValueOnce(1), // challengeSubmissionCount (challengeId: { not: null })
      },
      courseProgress: {
        count: vi.fn().mockResolvedValueOnce(2),
      },
    };

    const stage = await computeStudentStage("student-1", mockPrisma as never);
    expect(stage).toBe("EXPERIMENTAR");
  });
});

describe("Situational discovery scoring engine", () => {
  it("normalizes each area by max possible weight per scenario, seeds knownAreaSlugs, and is deterministic", () => {
    const questions: SituationalQuestion[] = [
      {
        id: "sq-1",
        options: [
          {
            id: "a",
            label: "Analisar dados e automatizar",
            weightsByArea: { "tecnologia-dados": 3, "design-criacao": 1 },
          },
          {
            id: "b",
            label: "Prototipar interface",
            weightsByArea: { "design-criacao": 3, "comunicacao-conteudo": 1 },
          },
          {
            id: "c",
            label: "Estruturar modelo de negocio",
            weightsByArea: { "negocios-empreendedorismo": 3 },
          },
        ],
      },
      {
        id: "sq-2",
        options: [
          {
            id: "a",
            label: "Criar script de acompanhamento",
            weightsByArea: {
              "tecnologia-dados": 2,
              "negocios-empreendedorismo": 1,
            },
          },
          {
            id: "b",
            label: "Desenhar material visual",
            weightsByArea: { "design-criacao": 2 },
          },
        ],
      },
    ];

    const answers = { "sq-1": "a", "sq-2": "a" };
    const knownAreas = [
      "tecnologia-dados",
      "design-criacao",
      "negocios-empreendedorismo",
      "comunicacao-conteudo",
      "sustentabilidade-impacto",
    ];

    const first = calculateSituationalAffinityScores(
      answers,
      questions,
      knownAreas,
    );
    const second = calculateSituationalAffinityScores(
      answers,
      questions,
      knownAreas,
    );

    expect(first).toEqual(second);
    // tecnologia-dados: (3+2)/(3+2) = 100
    // negocios-empreendedorismo: (0+1)/(3+1) = 25
    // design-criacao: (1+0)/(3+2) = 20
    // comunicacao-conteudo: (0)/(1) = 0
    // sustentabilidade-impacto: 0 (knownAreaSlug not in questions)
    expect(first.scores).toEqual({
      "tecnologia-dados": 100,
      "negocios-empreendedorismo": 25,
      "design-criacao": 20,
      "comunicacao-conteudo": 0,
      "sustentabilidade-impacto": 0,
    });
    expect(first.topAreas).toEqual([
      "tecnologia-dados",
      "negocios-empreendedorismo",
      "design-criacao",
    ]);
  });

  it("breaks ties in topAreas using selfPractice level first, then localeCompare", () => {
    const questions: SituationalQuestion[] = [
      {
        id: "sq-tie",
        options: [
          {
            id: "a",
            label: "Opcao equilibrada",
            weightsByArea: {
              "area-alpha": 2,
              "area-beta": 2,
              "area-gamma": 2,
              "area-delta": 2,
            },
          },
        ],
      },
    ];

    const withoutPractice = calculateSituationalAffinityScores(
      { "sq-tie": "a" },
      questions,
    );
    expect(withoutPractice.topAreas).toEqual([
      "area-alpha",
      "area-beta",
      "area-delta",
    ]);

    const withPractice = calculateSituationalAffinityScores(
      { "sq-tie": "a" },
      questions,
      undefined,
      {
        "area-alpha": 0,
        "area-beta": 1,
        "area-gamma": 2,
        "area-delta": 1,
      },
    );
    expect(withPractice.topAreas).toEqual([
      "area-gamma",
      "area-beta",
      "area-delta",
    ]);
  });

  it("ignores prototype keys (__proto__, constructor, prototype) in situational scoring without NaN", () => {
    const questions: SituationalQuestion[] = [
      {
        id: "sq-proto",
        options: [
          {
            id: "a",
            label: "Opção com chaves inseguras",
            weightsByArea: JSON.parse(
              `{"__proto__":3,"constructor":2,"prototype":4,"tecnologia-dados":3}`,
            ),
          },
        ],
      },
    ];

    const result = calculateSituationalAffinityScores(
      { "sq-proto": "a" },
      questions,
      ["__proto__", "constructor", "prototype", "tecnologia-dados"],
    );

    expect(result.scores).toEqual({ "tecnologia-dados": 100 });
    expect(result.topAreas).toEqual(["tecnologia-dados"]);
    expect(Object.hasOwn(result.scores, "__proto__")).toBe(false);
    expect(Object.hasOwn(result.scores, "constructor")).toBe(false);
    expect(Object.hasOwn(result.scores, "prototype")).toBe(false);
  });
});

describe("Proven practice, readiness and evolution", () => {
  it("calculates proven practice scores with 35/course, 50/challenge and cap at 100", () => {
    const summary = calculateProvenPractice({
      completedCourseAreaSlugs: [
        "one-course",
        "course-and-challenge",
        "two-courses-one-challenge",
        "two-courses-one-challenge",
      ],
      challengeProjectAreaSlugs: [
        "one-challenge",
        "course-and-challenge",
        "two-challenges",
        "two-challenges",
        "two-courses-one-challenge",
      ],
      totalProjects: 6,
      knownAreaSlugs: [
        "zero-area",
        "one-course",
        "one-challenge",
        "course-and-challenge",
        "two-challenges",
        "two-courses-one-challenge",
      ],
    });

    expect(summary.totalCompletedCourses).toBe(4);
    expect(summary.totalChallengeProjects).toBe(5);
    expect(summary.totalProjects).toBe(6);
    expect(summary.byArea["zero-area"]).toEqual({
      completedCourses: 0,
      challengeProjects: 0,
      score: 0,
    });
    expect(summary.byArea["one-course"]).toEqual({
      completedCourses: 1,
      challengeProjects: 0,
      score: 35,
    });
    expect(summary.byArea["one-challenge"]).toEqual({
      completedCourses: 0,
      challengeProjects: 1,
      score: 50,
    });
    expect(summary.byArea["course-and-challenge"]).toEqual({
      completedCourses: 1,
      challengeProjects: 1,
      score: 85,
    });
    expect(summary.byArea["two-challenges"]).toEqual({
      completedCourses: 0,
      challengeProjects: 2,
      score: 100,
    });
    expect(summary.byArea["two-courses-one-challenge"]).toEqual({
      completedCourses: 2,
      challengeProjects: 1,
      score: 100,
    });
  });

  it("resolves area readiness status for proven practice, self-practice level 2, and legacy null", () => {
    expect(
      resolveAreaReadinessStatus({ provenScore: 50, selfPracticeLevel: 0 }),
    ).toBe("PRONTO_PARA_EXPERIMENTAR");
    expect(
      resolveAreaReadinessStatus({ provenScore: 85, selfPracticeLevel: null }),
    ).toBe("PRONTO_PARA_EXPERIMENTAR");
    expect(
      resolveAreaReadinessStatus({ provenScore: 0, selfPracticeLevel: 2 }),
    ).toBe("PRONTO_PARA_EXPERIMENTAR");
    expect(
      resolveAreaReadinessStatus({ provenScore: 35, selfPracticeLevel: 1 }),
    ).toBe("POTENCIAL_PARA_TRILHA");
    expect(
      resolveAreaReadinessStatus({ provenScore: 0, selfPracticeLevel: null }),
    ).toBe("POTENCIAL_PARA_TRILHA");
  });

  it("resolves public readiness labels from proven practice scores", () => {
    expect(resolvePublicReadinessStatus(0)).toBe("Área de interesse");
    expect(resolvePublicReadinessStatus(35)).toBe("Em formação");
    expect(resolvePublicReadinessStatus(50)).toBe("Prática comprovada");
    expect(resolvePublicReadinessStatus(100)).toBe("Prática comprovada");
  });

  it("builds discovery comparison only when both current and previous results are situational", () => {
    const current = {
      scores: {
        "tecnologia-dados": 85,
        "design-criacao": 60,
        "negocios-empreendedorismo": 40,
      },
      topAreas: [
        "tecnologia-dados",
        "design-criacao",
        "negocios-empreendedorismo",
      ],
      isSituational: true,
    };

    expect(buildDiscoveryComparison(current, null)).toBeNull();
    expect(
      buildDiscoveryComparison(current, {
        scores: { "tecnologia-dados": 70 },
        topAreas: ["tecnologia-dados"],
        completedAt: "2026-10-01T10:00:00.000Z",
        isSituational: false,
      }),
    ).toBeNull();
    expect(
      buildDiscoveryComparison(
        { ...current, isSituational: false },
        {
          scores: { "tecnologia-dados": 70 },
          topAreas: ["tecnologia-dados"],
          completedAt: "2026-10-01T10:00:00.000Z",
          isSituational: true,
        },
      ),
    ).toBeNull();

    const comparison = buildDiscoveryComparison(current, {
      scores: {
        "tecnologia-dados": 70,
        "design-criacao": 75,
        "comunicacao-conteudo": 65,
      },
      topAreas: [
        "design-criacao",
        "tecnologia-dados",
        "comunicacao-conteudo",
      ],
      completedAt: "2026-10-01T10:00:00.000Z",
      isSituational: true,
    });

    expect(comparison).toEqual({
      previousCompletedAt: "2026-10-01T10:00:00.000Z",
      byArea: {
        "tecnologia-dados": {
          slug: "tecnologia-dados",
          delta: 15,
          isNewInTop3: false,
        },
        "design-criacao": {
          slug: "design-criacao",
          delta: -15,
          isNewInTop3: false,
        },
        "negocios-empreendedorismo": {
          slug: "negocios-empreendedorismo",
          delta: null,
          isNewInTop3: true,
        },
        "comunicacao-conteudo": {
          slug: "comunicacao-conteudo",
          delta: null,
          isNewInTop3: false,
        },
      },
    });
  });

  it("queries getStudentProvenPractice with isIncludedInShare filter only when sharedOnly is true", async () => {
    const courseFindMany = vi.fn().mockResolvedValue([
      {
        courseItem: {
          track: {
            macroArea: { slug: "tecnologia-dados" },
          },
        },
      },
    ]);
    const portfolioFindMany = vi.fn().mockResolvedValue([
      {
        challengeId: "ch-1",
        challenge: { macroArea: { slug: "tecnologia-dados" } },
      },
      {
        challengeId: null,
        challenge: null,
      },
    ]);

    const mockPrisma = {
      courseProgress: { findMany: courseFindMany },
      portfolioProject: { findMany: portfolioFindMany },
    };

    const fullSummary = await getStudentProvenPractice(
      "student-1",
      { knownAreaSlugs: ["tecnologia-dados", "design-criacao"] },
      mockPrisma as never,
    );

    expect(courseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "student-1", status: "CONCLUIDO" },
      }),
    );
    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "student-1" },
      }),
    );
    expect(fullSummary.totalCompletedCourses).toBe(1);
    expect(fullSummary.totalChallengeProjects).toBe(1);
    expect(fullSummary.totalProjects).toBe(2);
    expect(fullSummary.byArea["tecnologia-dados"].score).toBe(85);
    expect(fullSummary.byArea["design-criacao"].score).toBe(0);

    portfolioFindMany.mockClear();
    courseFindMany.mockClear();

    await getStudentProvenPractice(
      "student-1",
      { sharedOnly: false },
      mockPrisma as never,
    );
    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "student-1" },
      }),
    );

    portfolioFindMany.mockClear();

    await getStudentProvenPractice(
      "student-1",
      { sharedOnly: true },
      mockPrisma as never,
    );
    expect(portfolioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "student-1", isIncludedInShare: true },
      }),
    );
  });

  it("ignores prototype keys (__proto__, constructor, prototype) in calculateProvenPractice", () => {
    const summary = calculateProvenPractice({
      completedCourseAreaSlugs: ["__proto__", "constructor", "prototype", "tecnologia-dados"],
      challengeProjectAreaSlugs: ["__proto__", "constructor", "prototype", "design-criacao"],
      totalProjects: 2,
      knownAreaSlugs: ["__proto__", "constructor", "prototype", "tecnologia-dados"],
    });

    expect(summary.totalCompletedCourses).toBe(1);
    expect(summary.totalChallengeProjects).toBe(1);
    expect(summary.byArea).toEqual({
      "tecnologia-dados": {
        completedCourses: 1,
        challengeProjects: 0,
        score: 35,
      },
      "design-criacao": {
        completedCourses: 0,
        challengeProjects: 1,
        score: 50,
      },
    });
    expect(Object.hasOwn(summary.byArea, "__proto__")).toBe(false);
    expect(Object.hasOwn(summary.byArea, "constructor")).toBe(false);
    expect(Object.hasOwn(summary.byArea, "prototype")).toBe(false);
  });
});
