import { describe, expect, it, vi } from "vitest";
import { getClassroomEducationalView } from "@/lib/educator/classroom-analytics";

describe("Área do Educador — Visão Educacional e Privacidade por Padrão", () => {
  it("test_educator_cannot_view_other_educator_classroom", async () => {
    const findUniqueClassroom = vi.fn().mockResolvedValue({
      id: "class-1",
      name: "3º Ano A",
      inviteCode: "VC-ABC123",
      active: true,
      educatorId: "educator-owner",
      institution: { name: "Escola Estadual Modelo" },
      enrollments: [],
    });

    const prismaMock = {
      classroom: {
        findUnique: findUniqueClassroom,
      },
    };

    const result = await getClassroomEducationalView(
      "class-1",
      "educator-other",
      prismaMock as never,
    );

    expect(findUniqueClassroom).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "class-1" },
      }),
    );
    expect(result).toBeNull();
  });

  it("test_educational_view_excludes_raw_answers_and_private_projects", async () => {
    const findUniqueClassroom = vi.fn().mockResolvedValue({
      id: "class-1",
      name: "2º Ano B",
      inviteCode: "VC-TURMA2",
      active: true,
      educatorId: "educator-1",
      institution: { name: "Instituto Federal Teste" },
      enrollments: [
        {
          student: {
            id: "student-1",
            name: "Lucas Ferreira",
            email: "lucas.privado@escola.edu.br",
            discoveryResults: [
              {
                topAreas: ["tecnologia-dados", "design-criacao"],
                scoresJson: { "tecnologia-dados": 95, "design-criacao": 80 },
                selfPracticeJson: {
                  "tecnologia-dados": "pratica_guiada",
                  "design-criacao": "nunca_pratiquei",
                },
              },
            ],
            portfolioProjects: [
              {
                id: "proj-1",
                challengeId: null,
                title: "Projeto Secreto",
                reflection: "Reflexão íntima",
                challenge: null,
              },
              {
                id: "proj-2",
                challengeId: "chal-1",
                title: "Desafio Privado",
                challenge: { macroArea: { slug: "tecnologia-dados" } },
              },
            ],
            courseProgress: [
              {
                status: "CONCLUIDO",
                notes: "Anotação pessoal do aluno",
                courseItem: { track: { macroArea: { slug: "tecnologia-dados" } } },
              },
              {
                status: "NAO_INICIADO",
                notes: "Outra nota privada",
                courseItem: { track: { macroArea: { slug: "design-criacao" } } },
              },
            ],
            evidenceFiles: [{ id: "ev-1", originalName: "certificado.pdf" }],
          },
        },
        {
          student: {
            id: "student-2",
            name: "Mariana Costa",
            email: "mariana.privada@escola.edu.br",
            discoveryResults: [
              {
                topAreas: ["tecnologia-dados", "comunicacao-conteudo"],
                scoresJson: { "tecnologia-dados": 88 },
                selfPracticeJson: { "tecnologia-dados": "em_andamento" },
              },
            ],
            portfolioProjects: [
              {
                id: "proj-3",
                challengeId: "chal-2",
                challenge: { macroArea: { slug: "comunicacao-conteudo" } },
              },
            ],
            courseProgress: [
              {
                status: "EM_ANDAMENTO",
                notes: "Nota privada 2",
                courseItem: { track: { macroArea: { slug: "design-criacao" } } },
              },
            ],
          },
        },
      ],
    });

    const findManyMacroAreas = vi.fn().mockResolvedValue([
      { slug: "tecnologia-dados", name: "Tecnologia e Dados" },
      { slug: "design-criacao", name: "Design e Criação Digital" },
      { slug: "comunicacao-conteudo", name: "Comunicação e Conteúdo" },
    ]);

    const prismaMock = {
      classroom: {
        findUnique: findUniqueClassroom,
      },
      macroArea: {
        findMany: findManyMacroAreas,
      },
    };

    const result = await getClassroomEducationalView(
      "class-1",
      "educator-1",
      prismaMock as never,
    );

    expect(result).not.toBeNull();
    expect(result?.classroom).toEqual({
      id: "class-1",
      name: "2º Ano B",
      inviteCode: "VC-TURMA2",
      active: true,
      institutionName: "Instituto Federal Teste",
    });
    expect(result?.totalStudents).toBe(2);
    expect(result?.students).toEqual([
      {
        studentId: "student-1",
        name: "Lucas Ferreira",
        currentStage: "CONSTRUIR",
        topMacroAreas: ["Tecnologia e Dados", "Design e Criação Digital"],
      },
      {
        studentId: "student-2",
        name: "Mariana Costa",
        currentStage: "EXPERIMENTAR",
        topMacroAreas: ["Tecnologia e Dados", "Comunicação e Conteúdo"],
      },
    ]);

    expect(result?.stageDistribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "CONSTRUIR", count: 1 }),
        expect.objectContaining({ stage: "EXPERIMENTAR", count: 1 }),
        expect.objectContaining({ stage: "APRENDER", count: 0 }),
        expect.objectContaining({ stage: "DESCOBRIR", count: 0 }),
      ]),
    );

    expect(result?.macroAreaDistribution).toEqual([
      {
        slug: "tecnologia-dados",
        area: "Tecnologia e Dados",
        count: 2,
        interestCount: 2,
        practiceCount: 1,
      },
      {
        slug: "comunicacao-conteudo",
        area: "Comunicação e Conteúdo",
        count: 1,
        interestCount: 1,
        practiceCount: 1,
      },
      {
        slug: "design-criacao",
        area: "Design e Criação Digital",
        count: 1,
        interestCount: 1,
        practiceCount: 0,
      },
    ]);

    expect(result?.topGapArea).toEqual({
      slug: "tecnologia-dados",
      area: "Tecnologia e Dados",
      interestCount: 2,
      practiceCount: 1,
      gap: 1,
    });

    for (const student of result?.students ?? []) {
      expect(Object.keys(student).sort()).toEqual([
        "currentStage",
        "name",
        "studentId",
        "topMacroAreas",
      ]);
    }

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("lucas.privado@escola.edu.br");
    expect(serialized).not.toContain("mariana.privada@escola.edu.br");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("scoresJson");
    expect(serialized).not.toContain("selfPracticeJson");
    expect(serialized).not.toContain("pratica_guiada");
    expect(serialized).not.toContain("nunca_pratiquei");
    expect(serialized).not.toContain("notes");
    expect(serialized).not.toContain("reflection");
    expect(serialized).not.toContain("Projeto Secreto");
    expect(serialized).not.toContain("Reflexão íntima");
    expect(serialized).not.toContain("Anotação pessoal do aluno");
    expect(serialized).not.toContain("Nota privada 2");
    expect(serialized).not.toContain("certificado.pdf");
    expect(serialized).not.toContain("evidenceFiles");
    expect(serialized).not.toContain("portfolioProjects");
  });

  it("test_educational_view_returns_null_topGapArea_when_practice_covers_interest", async () => {
    const findUniqueClassroom = vi.fn().mockResolvedValue({
      id: "class-2",
      name: "3º Ano C",
      inviteCode: "VC-NO-GAP",
      active: true,
      educatorId: "educator-1",
      institution: { name: "Instituto Federal Teste" },
      enrollments: [
        {
          student: {
            id: "student-1",
            name: "Ana Lima",
            status: "ACTIVE",
            discoveryResults: [{ topAreas: ["tecnologia-dados"] }],
            portfolioProjects: [
              {
                id: "proj-1",
                challengeId: "chal-1",
                challenge: { macroArea: { slug: "design-criacao" } },
              },
            ],
            courseProgress: [
              {
                status: "CONCLUIDO",
                courseItem: { track: { macroArea: { slug: "tecnologia-dados" } } },
              },
            ],
          },
        },
      ],
    });

    const findManyMacroAreas = vi.fn().mockResolvedValue([
      { slug: "tecnologia-dados", name: "Tecnologia e Dados" },
      { slug: "design-criacao", name: "Design e Criação Digital" },
    ]);

    const result = await getClassroomEducationalView(
      "class-2",
      "educator-1",
      {
        classroom: { findUnique: findUniqueClassroom },
        macroArea: { findMany: findManyMacroAreas },
      } as never,
    );

    expect(result).not.toBeNull();
    expect(result?.macroAreaDistribution).toEqual([
      {
        slug: "tecnologia-dados",
        area: "Tecnologia e Dados",
        count: 1,
        interestCount: 1,
        practiceCount: 1,
      },
      {
        slug: "design-criacao",
        area: "Design e Criação Digital",
        count: 0,
        interestCount: 0,
        practiceCount: 1,
      },
    ]);
    expect(result?.topGapArea).toBeNull();
  });
});
