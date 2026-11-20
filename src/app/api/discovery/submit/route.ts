import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { calculateSituationalAffinityScores } from "@/lib/discovery/scoring";
import { parseQuestionOptions } from "@/lib/discovery/types";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

const submitDiscoverySchema = z.object({
  answers: z
    .record(
      z.string().min(1).max(64),
      z.string().min(1, "Selecione uma opção válida para cada cenário.").max(64),
    )
    .refine(
      (obj) => Object.keys(obj).length <= 50,
      "Número máximo de respostas excedido.",
    ),
  selfPractice: z
    .record(
      z.string().min(1).max(64),
      z.union([z.literal(0), z.literal(1), z.literal(2)], {
        message: "O nível de prática deve ser 0, 1 ou 2.",
      }),
    )
    .refine(
      (obj) => Object.keys(obj).length <= 20,
      "Número máximo de macroáreas excedido.",
    ),
});

export async function POST(request: Request) {
  const authResult = await requireApiRole(STUDENT_PORTAL_ROLES);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const parsed = submitDiscoverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Respostas do questionário inválidas.",
      },
      { status: 400 },
    );
  }

  try {
    const [questions, macroAreas] = await Promise.all([
      prisma.discoveryQuestion.findMany({
        orderBy: { order: "asc" },
      }),
      prisma.macroArea.findMany({
        select: { slug: true },
      }),
    ]);

    if (questions.length === 0 || macroAreas.length === 0) {
      return NextResponse.json(
        { error: "Configuração de descoberta indisponível no momento." },
        { status: 400 },
      );
    }

    const validQuestionIds = new Set(questions.map((question) => question.id));
    const hasUnknownQuestion = Object.keys(parsed.data.answers).some(
      (questionId) => !validQuestionIds.has(questionId),
    );
    if (hasUnknownQuestion) {
      return NextResponse.json(
        { error: "Respostas do questionário inválidas." },
        { status: 400 },
      );
    }

    const situationalQuestions = questions.map((q) => ({
      id: q.id,
      options: parseQuestionOptions(q.optionsJson),
    }));

    for (const question of situationalQuestions) {
      const selectedOptionId = parsed.data.answers[question.id];
      if (
        !selectedOptionId ||
        !question.options.some((opt) => opt.id === selectedOptionId)
      ) {
        return NextResponse.json(
          {
            error:
              "Responda todos os cenários com uma opção válida antes de enviar.",
          },
          { status: 400 },
        );
      }
    }

    const knownSlugs = macroAreas.map((area) => area.slug);
    const validAreaSlugs = new Set(knownSlugs);

    const hasUnknownArea = Object.keys(parsed.data.selfPractice).some(
      (slug) => !validAreaSlugs.has(slug),
    );
    if (hasUnknownArea) {
      return NextResponse.json(
        { error: "Mapa de ponto de partida inválido." },
        { status: 400 },
      );
    }

    const missingArea = knownSlugs.find(
      (slug) => parsed.data.selfPractice[slug] === undefined,
    );
    if (missingArea) {
      return NextResponse.json(
        {
          error:
            "Informe seu ponto de partida para todas as macroáreas antes de enviar.",
        },
        { status: 400 },
      );
    }

    const result = calculateSituationalAffinityScores(
      parsed.data.answers,
      situationalQuestions,
      knownSlugs,
      parsed.data.selfPractice,
    );

    const saved = await prisma.discoveryResult.create({
      data: {
        studentId: authResult.userId,
        scoresJson: result.scores,
        topAreas: result.topAreas,
        selfPracticeJson: parsed.data.selfPractice,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        id: saved.id,
        scores: result.scores,
        topAreas: result.topAreas,
        selfPractice: parsed.data.selfPractice,
        completedAt: saved.completedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao registrar descoberta." },
      { status: 500 },
    );
  }
}
