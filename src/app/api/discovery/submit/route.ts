import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { calculateAffinityScores } from "@/lib/discovery/scoring";
import { requireApiRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

const submitDiscoverySchema = z.object({
  answers: z.record(
    z.string().min(1),
    z
      .number({ message: "Cada resposta deve ser um número de 1 a 5." })
      .int("Cada resposta deve ser um número inteiro de 1 a 5.")
      .min(1, "A escala mínima é 1.")
      .max(5, "A escala máxima é 5."),
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

  const questions = await prisma.discoveryQuestion.findMany({
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma pergunta cadastrada no momento." },
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

  const missingQuestion = questions.find(
    (question) => parsed.data.answers[question.id] === undefined,
  );
  if (missingQuestion) {
    return NextResponse.json(
      { error: "Responda todas as perguntas do questionário antes de enviar." },
      { status: 400 },
    );
  }

  const scoringQuestions = questions.map((q) => ({
    id: q.id,
    weightsByArea:
      q.weightsByArea && typeof q.weightsByArea === "object"
        ? (q.weightsByArea as Record<string, number>)
        : {},
  }));

  const result = calculateAffinityScores(parsed.data.answers, scoringQuestions);

  const saved = await prisma.discoveryResult.create({
    data: {
      studentId: authResult.userId,
      scoresJson: result.scores,
      topAreas: result.topAreas,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(
    {
      id: saved.id,
      scores: result.scores,
      topAreas: result.topAreas,
      completedAt: saved.completedAt.toISOString(),
    },
    { status: 201 },
  );
}
