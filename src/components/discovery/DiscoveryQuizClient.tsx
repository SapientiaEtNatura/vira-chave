"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { AffinityChart } from "@/components/discovery/AffinityChart";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Progress,
} from "@/components/ui";

export interface QuizQuestionItem {
  id: string;
  order: number;
  prompt: string;
}

export interface MacroAreaSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface RecommendedTrackSummary {
  id: string;
  title: string;
  description: string;
  macroAreaSlug: string;
  macroAreaName: string;
  courseCount: number;
}

export interface DiscoveryResultView {
  id: string;
  scores: Record<string, number>;
  topAreas: string[];
  completedAt: string;
}

interface DiscoveryQuizClientProps {
  questions: QuizQuestionItem[];
  macroAreas: MacroAreaSummary[];
  tracks: RecommendedTrackSummary[];
  initialResult: DiscoveryResultView | null;
}

const LIKERT_OPTIONS = [
  { value: 1, label: "Nada a ver comigo" },
  { value: 2, label: "Pouco a ver comigo" },
  { value: 3, label: "Mais ou menos" },
  { value: 4, label: "Bastante a ver comigo" },
  { value: 5, label: "Tudo a ver comigo" },
] as const;

export function DiscoveryQuizClient({
  questions,
  macroAreas,
  tracks,
  initialResult,
}: DiscoveryQuizClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<DiscoveryResultView | null>(initialResult);
  const [isRetaking, setIsRetaking] = useState<boolean>(initialResult === null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const macroAreaBySlug = new Map(macroAreas.map((area) => [area.slug, area]));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!allAnswered) {
      setError("Responda todas as perguntas antes de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/discovery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Não foi possível salvar suas respostas.");
        return;
      }

      setResult({
        id: payload.id,
        scores: payload.scores,
        topAreas: payload.topAreas,
        completedAt: payload.completedAt,
      });
      setIsRetaking(false);
      router.refresh();
    } catch {
      setError("Erro de conexão ao enviar o questionário. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartRetake() {
    setAnswers({});
    setError(null);
    setIsRetaking(true);
  }

  if (isRetaking || !result) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--ink-primary)]">
              {answeredCount} de {questions.length} respondidas
            </p>
            {result ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRetaking(false);
                  setError(null);
                }}
              >
                Voltar ao resultado
              </Button>
            ) : (
              <span className="text-xs text-[var(--ink-muted)]">
                1 = Nada a ver · 5 = Tudo a ver
              </span>
            )}
          </div>

          <Progress
            value={answeredCount}
            max={questions.length || 1}
            tone="discover"
            label={`Progresso do questionário: ${answeredCount} de ${questions.length} respondidas`}
            showValue
          />
        </Card>

        {questions.length === 0 ? (
          <Alert variant="warning">
            Nenhuma pergunta de descoberta está disponível no momento.
          </Alert>
        ) : (
          <div className="space-y-5">
            {questions.map((question, index) => {
              const selectedValue = answers[question.id];
              return (
                <Card key={question.id} as="div" className="p-6 sm:p-7">
                  <fieldset>
                    <legend className="font-display text-base font-semibold leading-snug text-[var(--ink-primary)]">
                      <span className="mr-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stage-discover-bg)] font-mono text-xs font-bold text-[var(--stage-discover-ink)]">
                        {index + 1}
                      </span>
                      {question.prompt}
                    </legend>

                    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
                      {LIKERT_OPTIONS.map((option) => {
                        const isSelected = selectedValue === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-2.5 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)] ${
                              isSelected
                                ? "border-[var(--stage-discover-ink)] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)] ring-1 ring-[var(--stage-discover-ink)]"
                                : "border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.value}
                              checked={isSelected}
                              onChange={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: option.value,
                                }))
                              }
                              className="sr-only"
                            />
                            <span className="font-mono text-base font-bold">
                              {option.value}
                            </span>
                            <span className="mt-0.5 text-[11px] leading-tight">
                              {option.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </Card>
              );
            })}
          </div>
        )}

        {error ? <Alert variant="danger">{error}</Alert> : null}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={!allAnswered}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            {submitting
              ? "Calculando afinidades..."
              : "Ver meu mapa de afinidades"}
          </Button>
        </div>
      </form>
    );
  }

  const chartData = macroAreas.map((area) => ({
    slug: area.slug,
    name: area.name,
    score: result.scores[area.slug] ?? 0,
  }));

  const topAreaDetails = result.topAreas
    .map((slug) => macroAreaBySlug.get(slug))
    .filter((area): area is MacroAreaSummary => Boolean(area));

  const recommendedTracks = tracks.filter((track) =>
    result.topAreas.includes(track.macroAreaSlug),
  );

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(result.completedAt));

  return (
    <div className="space-y-8">
      <Card as="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Concluído em {formattedDate}</span>
            </Badge>
            <h2 className="font-display text-xl font-bold text-[var(--ink-primary)]">
              Seu Mapa de Afinidades
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStartRetake}
            leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          >
            Refazer
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AffinityChart data={chartData} />
          </div>

          <div className="space-y-3 lg:col-span-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Suas 3 principais áreas
            </h3>
            {topAreaDetails.map((area, index) => (
              <div
                key={area.slug}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)]/45 px-4 py-3"
              >
                <span className="text-sm font-bold text-[var(--ink-primary)]">
                  {index + 1}. {area.name}
                </span>
                <span className="rounded-full bg-[var(--stage-discover-ink)] px-2.5 py-0.5 font-mono text-xs font-bold text-white tabular-nums">
                  {result.scores[area.slug] ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-[var(--ink-primary)]">
            Trilhas recomendadas para você
          </h2>
          <ButtonLink
            href="/app/aprender"
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            Ver todas
          </ButtonLink>
        </div>

        {recommendedTracks.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="Nenhuma trilha publicada para suas áreas de destaque no momento."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedTracks.map((track) => (
              <Card
                key={track.id}
                as="article"
                variant="interactive"
                padding="sm"
                className="flex flex-col justify-between gap-4 p-5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="neutral">{track.macroAreaName}</Badge>
                    <span className="font-mono text-xs font-medium text-[var(--ink-muted)]">
                      {track.courseCount}{" "}
                      {track.courseCount === 1 ? "curso" : "cursos"}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
                    {track.title}
                  </h3>
                </div>

                <div>
                  <ButtonLink
                    href={`/app/aprender/${track.id}`}
                    variant="secondary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    Abrir trilha
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
