import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  findManyQuestions: vi.fn(),
  findManyMacroAreas: vi.fn(),
  createDiscoveryResult: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireApiRole: mocks.requireApiRole,
  STUDENT_PORTAL_ROLES: [Role.ESTUDANTE, Role.ADMIN],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    discoveryQuestion: {
      findMany: mocks.findManyQuestions,
    },
    macroArea: {
      findMany: mocks.findManyMacroAreas,
    },
    discoveryResult: {
      create: mocks.createDiscoveryResult,
    },
  },
}));

import { POST } from "@/app/api/discovery/submit/route";

const SAMPLE_MACRO_AREAS = [
  { slug: "tecnologia-dados" },
  { slug: "design-criacao" },
  { slug: "negocios-empreendedorismo" },
];

const SAMPLE_QUESTIONS = [
  {
    id: "q-1",
    order: 1,
    optionsJson: [
      {
        id: "q1-a",
        label: "Analisar dados",
        weightsByArea: { "tecnologia-dados": 3, "negocios-empreendedorismo": 1 },
      },
      {
        id: "q1-b",
        label: "Criar protótipo visual",
        weightsByArea: { "design-criacao": 3 },
      },
    ],
  },
  {
    id: "q-2",
    order: 2,
    optionsJson: [
      {
        id: "q2-a",
        label: "Automatizar planilha",
        weightsByArea: { "tecnologia-dados": 2 },
      },
      {
        id: "q2-b",
        label: "Organizar pitch",
        weightsByArea: { "negocios-empreendedorismo": 3 },
      },
    ],
  },
];

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/discovery/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/discovery/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiRole.mockResolvedValue({
      userId: "student-1",
      role: Role.ESTUDANTE,
      institutionId: "inst-1",
    });
    mocks.findManyMacroAreas.mockResolvedValue(SAMPLE_MACRO_AREAS);
    mocks.findManyQuestions.mockResolvedValue(SAMPLE_QUESTIONS);
    mocks.createDiscoveryResult.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "result-1",
        ...data,
        completedAt: new Date("2026-11-19T12:00:00.000Z"),
      }),
    );
  });

  it("saves scoresJson, topAreas and selfPracticeJson and returns 201 for valid payload", async () => {
    const selfPractice = {
      "tecnologia-dados": 2,
      "design-criacao": 0,
      "negocios-empreendedorismo": 1,
    } as const;

    const response = await POST(
      makeRequest({
        answers: {
          "q-1": "q1-a",
          "q-2": "q2-a",
        },
        selfPractice,
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(mocks.createDiscoveryResult).toHaveBeenCalledTimes(1);
    expect(mocks.createDiscoveryResult).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: "student-1",
        scoresJson: {
          "tecnologia-dados": 100,
          "design-criacao": 0,
          "negocios-empreendedorismo": 25,
        },
        topAreas: [
          "tecnologia-dados",
          "negocios-empreendedorismo",
          "design-criacao",
        ],
        selfPracticeJson: selfPractice,
      }),
    });

    expect(json).toEqual({
      id: "result-1",
      scores: {
        "tecnologia-dados": 100,
        "design-criacao": 0,
        "negocios-empreendedorismo": 25,
      },
      topAreas: [
        "tecnologia-dados",
        "negocios-empreendedorismo",
        "design-criacao",
      ],
      selfPractice,
      completedAt: "2026-11-19T12:00:00.000Z",
    });
  });

  it("rejects with 400 without calling create when optionId belongs to another question or does not exist", async () => {
    const crossQuestionRes = await POST(
      makeRequest({
        answers: {
          "q-1": "q2-a",
          "q-2": "q2-b",
        },
        selfPractice: {
          "tecnologia-dados": 1,
          "design-criacao": 0,
          "negocios-empreendedorismo": 2,
        },
      }),
    );

    expect(crossQuestionRes.status).toBe(400);
    expect(mocks.createDiscoveryResult).not.toHaveBeenCalled();

    const nonexistentOptionRes = await POST(
      makeRequest({
        answers: {
          "q-1": "q1-a",
          "q-2": "nonexistent-opt",
        },
        selfPractice: {
          "tecnologia-dados": 1,
          "design-criacao": 0,
          "negocios-empreendedorismo": 2,
        },
      }),
    );

    expect(nonexistentOptionRes.status).toBe(400);
    expect(mocks.createDiscoveryResult).not.toHaveBeenCalled();
  });

  it("rejects with 400 when a question is missing, an area is missing in selfPractice, or unknown keys are sent", async () => {
    const missingQuestionRes = await POST(
      makeRequest({
        answers: {
          "q-1": "q1-a",
        },
        selfPractice: {
          "tecnologia-dados": 1,
          "design-criacao": 0,
          "negocios-empreendedorismo": 2,
        },
      }),
    );
    expect(missingQuestionRes.status).toBe(400);

    const unknownQuestionRes = await POST(
      makeRequest({
        answers: {
          "q-1": "q1-a",
          "q-2": "q2-a",
          "q-unknown": "q1-a",
        },
        selfPractice: {
          "tecnologia-dados": 1,
          "design-criacao": 0,
          "negocios-empreendedorismo": 2,
        },
      }),
    );
    expect(unknownQuestionRes.status).toBe(400);

    const missingAreaRes = await POST(
      makeRequest({
        answers: {
          "q-1": "q1-a",
          "q-2": "q2-a",
        },
        selfPractice: {
          "tecnologia-dados": 1,
          "design-criacao": 0,
        },
      }),
    );
    expect(missingAreaRes.status).toBe(400);

    const unknownAreaRes = await POST(
      makeRequest({
        answers: {
          "q-1": "q1-a",
          "q-2": "q2-a",
        },
        selfPractice: {
          "tecnologia-dados": 1,
          "design-criacao": 0,
          "negocios-empreendedorismo": 2,
          "area-fantasma": 1,
        },
      }),
    );
    expect(unknownAreaRes.status).toBe(400);
    expect(mocks.createDiscoveryResult).not.toHaveBeenCalled();
  });

  it("rejects with 400 when selfPractice contains values outside {0, 1, 2}", async () => {
    const invalidValues: unknown[] = [3, -1, 1.5, "2"];

    for (const invalidValue of invalidValues) {
      const response = await POST(
        makeRequest({
          answers: {
            "q-1": "q1-a",
            "q-2": "q2-a",
          },
          selfPractice: {
            "tecnologia-dados": invalidValue,
            "design-criacao": 0,
            "negocios-empreendedorismo": 1,
          },
        }),
      );

      expect(response.status).toBe(400);
    }

    expect(mocks.createDiscoveryResult).not.toHaveBeenCalled();
  });
});
