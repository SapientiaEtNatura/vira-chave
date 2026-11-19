import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  recordAuditLog: vi.fn(),
  prisma: {
    macroArea: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    discoveryQuestion: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    track: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    challenge: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rbac", () => ({
  requireApiRole: mocks.requireApiRole,
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit")>();
  return {
    ...actual,
    recordAuditLog: mocks.recordAuditLog,
  };
});

import { GET, PATCH, POST } from "@/app/api/admin/content/route";

function makeJsonRequest(method: "POST" | "PATCH", body: unknown) {
  return new Request("http://localhost/api/admin/content", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_OPTIONS = [
  {
    id: "a",
    label: "Organizar os dados da turma em uma planilha clara.",
    weightsByArea: { "tecnologia-dados": 3, "negocios-empreendedorismo": 1 },
  },
  {
    id: "b",
    label: "Desenhar o cartaz e o fluxo visual do projeto.",
    weightsByArea: { "design-criacao": 4, "tecnologia-dados": 1 },
  },
  {
    id: "c",
    label: "Entrevistar colegas e apresentar os resultados no microfone.",
    weightsByArea: { "comunicacao-conteudo": 3 },
  },
  {
    id: "d",
    label: "Cuidar do bem-estar da equipe e mediar o cronograma.",
    weightsByArea: { "saude-bem-estar": 2, "educacao-social": 2 },
  },
];

describe("API /api/admin/content — Cenários Situacionais e entryRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiRole.mockResolvedValue({
      userId: "admin-1",
      role: Role.ADMIN,
      institutionId: null,
    });
    mocks.recordAuditLog.mockResolvedValue(undefined);
  });

  it("POST question com 4 opções válidas grava optionsJson, deriva weightsByArea e retorna 201 com item.options", async () => {
    mocks.prisma.discoveryQuestion.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "q-new",
        ...data,
      }),
    );

    const response = await POST(
      makeJsonRequest("POST", {
        kind: "question",
        prompt: "Em um projeto escolar de feira comunitária, qual tarefa você assume primeiro?",
        order: 1,
        options: VALID_OPTIONS,
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.prisma.discoveryQuestion.create).toHaveBeenCalledWith({
      data: {
        prompt:
          "Em um projeto escolar de feira comunitária, qual tarefa você assume primeiro?",
        order: 1,
        optionsJson: VALID_OPTIONS,
        weightsByArea: {
          "tecnologia-dados": 3,
          "negocios-empreendedorismo": 1,
          "design-criacao": 4,
          "comunicacao-conteudo": 3,
          "saude-bem-estar": 2,
          "educacao-social": 2,
        },
      },
    });
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        actorRole: Role.ADMIN,
        targetType: "question",
        targetId: "q-new",
      }),
    );

    const payload = (await response.json()) as {
      item: { id: string; options: typeof VALID_OPTIONS; weightsByArea: Record<string, number> };
    };
    expect(payload.item.id).toBe("q-new");
    expect(payload.item.options).toEqual(VALID_OPTIONS);
    expect(payload.item.weightsByArea["design-criacao"]).toBe(4);
    expect(payload.item.weightsByArea["tecnologia-dados"]).toBe(3);
  });

  it("PATCH question com options atualiza optionsJson, deriva weightsByArea e retorna item.options", async () => {
    const updatedOptions = VALID_OPTIONS.slice(0, 2);
    mocks.prisma.discoveryQuestion.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "q-1",
        prompt: "Enunciado existente",
        order: 1,
        ...data,
      }),
    );

    const response = await PATCH(
      makeJsonRequest("PATCH", {
        kind: "question",
        id: "q-1",
        options: updatedOptions,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.prisma.discoveryQuestion.update).toHaveBeenCalledWith({
      where: { id: "q-1" },
      data: {
        optionsJson: updatedOptions,
        weightsByArea: {
          "tecnologia-dados": 3,
          "negocios-empreendedorismo": 1,
          "design-criacao": 4,
        },
      },
    });
    const payload = (await response.json()) as {
      item: { options: typeof updatedOptions };
    };
    expect(payload.item.options).toEqual(updatedOptions);
  });

  it("GET retorna questions serializadas com options normalizado via parseQuestionOptions", async () => {
    mocks.prisma.macroArea.findMany.mockResolvedValue([]);
    mocks.prisma.discoveryQuestion.findMany.mockResolvedValue([
      {
        id: "q-1",
        prompt: "Cenário 1",
        order: 1,
        weightsByArea: { "tecnologia-dados": 3 },
        optionsJson: VALID_OPTIONS.slice(0, 2),
      },
    ]);
    mocks.prisma.track.findMany.mockResolvedValue([]);
    mocks.prisma.courseItem.findMany.mockResolvedValue([]);
    mocks.prisma.challenge.findMany.mockResolvedValue([]);

    const response = await GET();
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      questions: Array<{ id: string; options: unknown[] }>;
    };
    expect(payload.questions[0].options).toEqual(VALID_OPTIONS.slice(0, 2));
  });

  it.each([
    {
      label: "< 2 opções",
      options: [VALID_OPTIONS[0]],
    },
    {
      label: "> 4 opções",
      options: [
        ...VALID_OPTIONS,
        {
          id: "e",
          label: "Quinta opção além do limite permitido.",
          weightsByArea: { "tecnologia-dados": 2 },
        },
      ],
    },
    {
      label: "id duplicado entre opções",
      options: [
        VALID_OPTIONS[0],
        { ...VALID_OPTIONS[1], id: " a " },
      ],
    },
    {
      label: "label curto (< 5 chars)",
      options: [
        { ...VALID_OPTIONS[0], label: "Oi" },
        VALID_OPTIONS[1],
      ],
    },
    {
      label: "opção onde todos os pesos são 0",
      options: [
        {
          id: "a",
          label: "Opção válida com texto suficiente.",
          weightsByArea: { "tecnologia-dados": 0, "design-criacao": 0 },
        },
        VALID_OPTIONS[1],
      ],
    },
  ])("POST e PATCH question rejeitam com 400 sem tocar no Prisma quando há $label", async ({ options }) => {
    const postRes = await POST(
      makeJsonRequest("POST", {
        kind: "question",
        prompt: "Qual é a sua primeira atitude diante de um novo desafio?",
        order: 1,
        options,
      }),
    );
    expect(postRes.status).toBe(400);

    const patchRes = await PATCH(
      makeJsonRequest("PATCH", {
        kind: "question",
        id: "q-1",
        options,
      }),
    );
    expect(patchRes.status).toBe(400);

    expect(mocks.prisma.discoveryQuestion.create).not.toHaveBeenCalled();
    expect(mocks.prisma.discoveryQuestion.update).not.toHaveBeenCalled();
  });

  it("POST e PATCH macroArea persistem entryRoles válidos e POST sem entryRoles usa [] por padrão", async () => {
    mocks.prisma.macroArea.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "ma-1",
        ...data,
      }),
    );
    mocks.prisma.macroArea.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "ma-1",
        name: "Tecnologia e Dados",
        slug: "tecnologia-dados",
        description: "Área tech",
        ...data,
      }),
    );

    const postRes = await POST(
      makeJsonRequest("POST", {
        kind: "macroArea",
        name: "Tecnologia e Dados",
        slug: "tecnologia-dados",
        description: "Soluções digitais e análise de dados.",
        entryRoles: ["  Suporte Técnico  ", "Análise de Dados"],
      }),
    );
    expect(postRes.status).toBe(201);
    expect(mocks.prisma.macroArea.create).toHaveBeenCalledWith({
      data: {
        name: "Tecnologia e Dados",
        slug: "tecnologia-dados",
        description: "Soluções digitais e análise de dados.",
        entryRoles: ["Suporte Técnico", "Análise de Dados"],
      },
    });

    const postDefaultRes = await POST(
      makeJsonRequest("POST", {
        kind: "macroArea",
        name: "Design",
        slug: "design",
        description: "Criação visual e produtos.",
      }),
    );
    expect(postDefaultRes.status).toBe(201);
    expect(mocks.prisma.macroArea.create).toHaveBeenLastCalledWith({
      data: {
        name: "Design",
        slug: "design",
        description: "Criação visual e produtos.",
        entryRoles: [],
      },
    });

    const patchRes = await PATCH(
      makeJsonRequest("PATCH", {
        kind: "macroArea",
        id: "ma-1",
        entryRoles: ["Suporte Técnico", "Análise de Dados"],
      }),
    );
    expect(patchRes.status).toBe(200);
    expect(mocks.prisma.macroArea.update).toHaveBeenCalledWith({
      where: { id: "ma-1" },
      data: {
        entryRoles: ["Suporte Técnico", "Análise de Dados"],
      },
    });
  });

  it.each([
    {
      label: "> 8 itens",
      entryRoles: ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"],
    },
    {
      label: "item com > 60 chars",
      entryRoles: ["A".repeat(61)],
    },
    {
      label: "item com < 2 chars",
      entryRoles: ["X"],
    },
  ])("POST e PATCH macroArea rejeitam com 400 quando entryRoles tem $label", async ({ entryRoles }) => {
    const postRes = await POST(
      makeJsonRequest("POST", {
        kind: "macroArea",
        name: "Tecnologia e Dados",
        slug: "tecnologia-dados",
        description: "Soluções digitais e análise de dados.",
        entryRoles,
      }),
    );
    expect(postRes.status).toBe(400);

    const patchRes = await PATCH(
      makeJsonRequest("PATCH", {
        kind: "macroArea",
        id: "ma-1",
        entryRoles,
      }),
    );
    expect(patchRes.status).toBe(400);

    expect(mocks.prisma.macroArea.create).not.toHaveBeenCalled();
    expect(mocks.prisma.macroArea.update).not.toHaveBeenCalled();
  });
});
