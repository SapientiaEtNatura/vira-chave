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
              },
            ],
            portfolioProjects: [
              { id: "proj-1", challengeId: null, title: "Projeto Secreto", reflection: "Reflexão íntima" },
              { id: "proj-2", challengeId: "chal-1", title: "Desafio Privado" },
            ],
            courseProgress: [
              { status: "CONCLUIDO", notes: "Anotação pessoal do aluno" },
              { status: "NAO_INICIADO", notes: "Outra nota privada" },
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
              },
            ],
            portfolioProjects: [{ id: "proj-3", challengeId: "chal-2" }],
            courseProgress: [{ status: "EM_ANDAMENTO", notes: "Nota privada 2" }],
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

    expect(result?.macroAreaDistribution).toEqual(
      expect.arrayContaining([
        { area: "Tecnologia e Dados", count: 2 },
        { area: "Design e Criação Digital", count: 1 },
        { area: "Comunicação e Conteúdo", count: 1 },
      ]),
    );

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("lucas.privado@escola.edu.br");
    expect(serialized).not.toContain("mariana.privada@escola.edu.br");
    expect(serialized).not.toContain("scoresJson");
    expect(serialized).not.toContain("Projeto Secreto");
    expect(serialized).not.toContain("Reflexão íntima");
    expect(serialized).not.toContain("Anotação pessoal do aluno");
    expect(serialized).not.toContain("Nota privada 2");
    expect(serialized).not.toContain("certificado.pdf");
    expect(serialized).not.toContain("evidenceFiles");
    expect(serialized).not.toContain("portfolioProjects");
  });
});
