import { describe, expect, it, vi } from "vitest";
import {
  calculateAffinityScores,
  type DiscoveryScoringQuestion,
} from "@/lib/discovery/scoring";
import {
  computeStudentStage,
  resolveStageFromMilestones,
} from "@/lib/student/stage";

describe("Discovery scoring engine", () => {
  it("test_scoring_engine_aggregates_likert_1_to_5_weights_deterministically", () => {
    const questions: DiscoveryScoringQuestion[] = [
      {
        id: "q-1",
        weightsByArea: {
          "tecnologia-dados": 3,
          "design-criacao": 1,
        },
      },
      {
        id: "q-2",
        weightsByArea: {
          "tecnologia-dados": 2,
          "negocios-empreendedorismo": 2,
        },
      },
      {
        id: "q-3",
        weightsByArea: {
          "comunicacao-conteudo": 3,
          "sustentabilidade-impacto": 1,
        },
      },
    ];

    const answers = {
      "q-1": 5,
      "q-2": 4,
      "q-3": 2,
    };

    const firstRun = calculateAffinityScores(answers, questions);
    const secondRun = calculateAffinityScores(answers, questions);

    expect(firstRun).toEqual(secondRun);

    // tecnologia-dados: (5*3 + 4*2) / (5*3 + 5*2) = 23 / 25 = 92
    // design-criacao: (5*1) / (5*1) = 100
    // negocios-empreendedorismo: (4*2) / (5*2) = 80
    // comunicacao-conteudo: (2*3) / (5*3) = 40
    // sustentabilidade-impacto: (2*1) / (5*1) = 40
    expect(firstRun.scores).toEqual({
      "tecnologia-dados": 92,
      "design-criacao": 100,
      "negocios-empreendedorismo": 80,
      "comunicacao-conteudo": 40,
      "sustentabilidade-impacto": 40,
    });

    expect(firstRun.topAreas).toEqual([
      "design-criacao",
      "tecnologia-dados",
      "negocios-empreendedorismo",
    ]);
    expect(firstRun.topAreas.length).toBeLessThanOrEqual(3);
  });
});

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
