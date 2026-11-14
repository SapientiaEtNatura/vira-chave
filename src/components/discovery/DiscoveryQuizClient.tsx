"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { AffinityChart } from "@/components/discovery/AffinityChart";

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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Progresso do questionário: {answeredCount} de {questions.length} respondidas
            </p>
            <p className="text-xs text-slate-500">
              Marque de 1 (Nada a ver comigo) a 5 (Tudo a ver comigo) em cada afirmação.
            </p>
          </div>
          {result ? (
            <button
              type="button"
              onClick={() => {
                setIsRetaking(false);
                setError(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Voltar ao resultado anterior
            </button>
          ) : null}
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Nenhuma pergunta de descoberta está disponível no momento.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const selectedValue = answers[question.id];
              return (
                <fieldset
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <legend className="text-base font-semibold text-slate-900">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </span>
                    {question.prompt}
                  </legend>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {LIKERT_OPTIONS.map((option) => {
                      const isSelected = selectedValue === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-2.5 text-center transition ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600"
                              : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
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
                          <span className="text-base font-bold">{option.value}</span>
                          <span className="mt-0.5 text-[11px] leading-tight">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
          >
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting || !allAnswered}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>
              {submitting ? "Calculando afinidades..." : "Ver meu mapa de afinidades"}
            </span>
          </button>
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Questionário concluído em {formattedDate}</span>
            </div>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              Seu Mapa de Afinidades
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pontuação normalizada de 0 a 100 com base nas suas respostas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartRetake}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Refazer questionário</span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AffinityChart data={chartData} />
          </div>

          <div className="space-y-3 lg:col-span-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Suas 3 principais áreas
            </h3>
            {topAreaDetails.map((area, index) => (
              <div
                key={area.slug}
                className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {index + 1}. {area.name}
                  </span>
                  <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">
                    {result.scores[area.slug] ?? 0}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Trilhas recomendadas para você no Aprender
            </h2>
            <p className="text-sm text-slate-600">
              Cursos e trilhas alinhados às suas maiores afinidades.
            </p>
          </div>
          <Link
            href="/app/aprender"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>Explorar todas as trilhas</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {recommendedTracks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Nenhuma trilha publicada encontrada para suas áreas de destaque no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedTracks.map((track) => (
              <article
                key={track.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {track.macroAreaName}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-900">
                    {track.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {track.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    {track.courseCount}{" "}
                    {track.courseCount === 1 ? "curso" : "cursos"}
                  </span>
                  <Link
                    href={`/app/aprender?area=${encodeURIComponent(track.macroAreaSlug)}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>Ver trilha</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
