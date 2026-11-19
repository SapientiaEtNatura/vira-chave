"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Rocket,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AffinityChart } from "@/components/discovery/AffinityChart";
import { ScenarioFlashcardDeck } from "@/components/discovery/ScenarioFlashcardDeck";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Progress,
} from "@/components/ui";
import {
  buildDiscoveryComparison,
  resolveAreaReadinessStatus,
  type DiscoveryComparison,
  type ProvenPracticeSummary,
} from "@/lib/discovery/readiness";
import type { SelfPracticeLevel } from "@/lib/discovery/types";

export interface QuizQuestionOptionItem {
  id: string;
  label: string;
}

export interface QuizQuestionItem {
  id: string;
  order: number;
  prompt: string;
  options: QuizQuestionOptionItem[];
}

export interface MacroAreaSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  entryRoles: string[];
}

export interface RecommendedTrackSummary {
  id: string;
  title: string;
  description: string;
  macroAreaSlug: string;
  macroAreaName: string;
  courseCount: number;
}

export interface RecommendedChallengeSummary {
  id: string;
  title: string;
  description: string;
  macroAreaSlug: string;
  macroAreaName: string;
}

export interface DiscoveryResultView {
  id: string;
  scores: Record<string, number>;
  topAreas: string[];
  selfPractice: Record<string, SelfPracticeLevel> | null;
  completedAt: string;
}

interface DiscoveryQuizClientProps {
  header?: ReactNode;
  questions: QuizQuestionItem[];
  macroAreas: MacroAreaSummary[];
  tracks: RecommendedTrackSummary[];
  challenges: RecommendedChallengeSummary[];
  provenPractice: ProvenPracticeSummary;
  initialResult: DiscoveryResultView | null;
  initialComparison: DiscoveryComparison | null;
}

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

function subscribeMobileViewport(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMobileViewportSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getMobileViewportServerSnapshot(): boolean {
  return false;
}

function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getMobileViewportServerSnapshot,
  );
}

const SELF_PRACTICE_OPTIONS: ReadonlyArray<{
  value: SelfPracticeLevel;
  label: string;
}> = [
  { value: 0, label: "Nunca tentei" },
  { value: 1, label: "Já testei" },
  { value: 2, label: "Já criei algo" },
];

function formatDatePtBr(isoString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(isoString));
}

export function DiscoveryQuizClient({
  header,
  questions,
  macroAreas,
  tracks,
  challenges,
  provenPractice,
  initialResult,
  initialComparison,
}: DiscoveryQuizClientProps) {
  const router = useRouter();
  const isMobileViewport = useIsMobileViewport();
  const [result, setResult] = useState<DiscoveryResultView | null>(
    initialResult,
  );
  const [comparison, setComparison] = useState<DiscoveryComparison | null>(
    initialComparison,
  );
  const [isRetaking, setIsRetaking] = useState<boolean>(initialResult === null);
  const [step, setStep] = useState<1 | 2>(1);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selfPractice, setSelfPractice] = useState<
    Record<string, SelfPracticeLevel>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined,
  ).length;
  const allAnswered =
    questions.length > 0 && answeredCount === questions.length;

  const practiceCount = macroAreas.filter(
    (area) => selfPractice[area.slug] !== undefined,
  ).length;
  const allPracticeAnswered =
    macroAreas.length > 0 && practiceCount === macroAreas.length;

  const macroAreaBySlug = new Map(macroAreas.map((area) => [area.slug, area]));

  function handleGoToStep2() {
    setError(null);
    if (!allAnswered) {
      setError("Responda todos os cenários antes de avançar.");
      return;
    }
    setStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBackToScenarios() {
    setError(null);
    setStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!allAnswered) {
      setStep(1);
      setError("Responda todos os cenários antes de enviar.");
      return;
    }

    if (!allPracticeAnswered) {
      setError("Informe seu ponto de partida para todas as macroáreas.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/discovery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, selfPractice }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Não foi possível salvar suas respostas.");
        return;
      }

      const nextResult: DiscoveryResultView = {
        id: payload.id,
        scores: payload.scores,
        topAreas: payload.topAreas,
        selfPractice: payload.selfPractice ?? selfPractice,
        completedAt: payload.completedAt,
      };

      const nextComparison = result
        ? buildDiscoveryComparison(
            {
              scores: nextResult.scores,
              topAreas: nextResult.topAreas,
              isSituational: nextResult.selfPractice !== null,
            },
            {
              scores: result.scores,
              topAreas: result.topAreas,
              completedAt: result.completedAt,
              isSituational: result.selfPractice !== null,
            },
          )
        : null;

      setResult(nextResult);
      setComparison(nextComparison);
      setIsRetaking(false);
      setStep(1);
      setActiveScenarioIndex(0);
      router.refresh();
    } catch {
      setError("Erro de conexão ao enviar o questionário. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartRetake() {
    setAnswers({});
    setSelfPractice({});
    setStep(1);
    setActiveScenarioIndex(0);
    setError(null);
    setIsRetaking(true);
  }

  function handleSelectAnswer(questionId: string, optionId: string) {
    setError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  if (isRetaking || !result) {
    const showMobileDeck = isMobileViewport && step === 1;
    const scenarioPercent = Math.round(
      (answeredCount / (questions.length || 1)) * 100,
    );

    return (
      <div className="space-y-6">
        {header ? <div className="hidden lg:block">{header}</div> : null}
        <h1 className="sr-only lg:hidden">Descubra suas afinidades</h1>

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
          {showMobileDeck ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--stage-discover-ink)]">
                  Passo 1 de 2 · {answeredCount} de {questions.length} respondidos
                </p>

                {result ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setIsRetaking(false);
                      setStep(1);
                      setActiveScenarioIndex(0);
                      setError(null);
                    }}
                  >
                    Voltar ao resultado
                  </Button>
                ) : (
                  <span className="font-mono text-xs font-semibold text-[var(--ink-muted)] tabular-nums">
                    {scenarioPercent}%
                  </span>
                )}
              </div>

              <Progress
                value={answeredCount}
                max={questions.length || 1}
                tone="discover"
                label={`Progresso dos cenários: ${answeredCount} de ${questions.length}`}
              />
            </div>
          ) : (
            <Card className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--stage-discover-ink)]">
                    {step === 1
                      ? "Passo 1 de 2 · Cenários situacionais"
                      : "Passo 2 de 2 · Ponto de partida"}
                  </p>
                  <p className="text-sm font-semibold text-[var(--ink-primary)]">
                    {step === 1
                      ? `${answeredCount} de ${questions.length} cenários respondidos`
                      : `${practiceCount} de ${macroAreas.length} áreas preenchidas`}
                  </p>
                </div>

                {result ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRetaking(false);
                      setStep(1);
                      setActiveScenarioIndex(0);
                      setError(null);
                    }}
                  >
                    Voltar ao resultado
                  </Button>
                ) : (
                  <span className="text-xs text-[var(--ink-muted)]">
                    {step === 1
                      ? "Escolha a reação que mais combina com você"
                      : "Indique o que você já testou na prática"}
                  </span>
                )}
              </div>

              <Progress
                value={step === 1 ? answeredCount : practiceCount}
                max={
                  step === 1 ? questions.length || 1 : macroAreas.length || 1
                }
                tone="discover"
                label={
                  step === 1
                    ? `Progresso dos cenários: ${answeredCount} de ${questions.length}`
                    : `Progresso do ponto de partida: ${practiceCount} de ${macroAreas.length}`
                }
                showValue
              />
            </Card>
          )}

          {step === 1 ? (
            <>
              {questions.length === 0 ? (
                <Alert variant="warning">
                  Nenhum cenário de descoberta está disponível no momento.
                </Alert>
              ) : isMobileViewport ? (
                <>
                  <ScenarioFlashcardDeck
                    questions={questions}
                    answers={answers}
                    activeIndex={activeScenarioIndex}
                    onActiveIndexChange={setActiveScenarioIndex}
                    onSelectAnswer={handleSelectAnswer}
                    onCompleteScenarios={handleGoToStep2}
                  />
                  {error ? <Alert variant="danger">{error}</Alert> : null}
                </>
              ) : (
                <div className="hidden space-y-6 lg:block">
                  <div className="space-y-5">
                    {questions.map((question, index) => {
                      const selectedOptionId = answers[question.id];
                      return (
                        <Card key={question.id} as="div" className="p-6 sm:p-7">
                          <fieldset>
                            <legend className="font-display text-base font-semibold leading-snug text-[var(--ink-primary)]">
                              <span className="mr-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stage-discover-bg)] font-mono text-xs font-bold text-[var(--stage-discover-ink)]">
                                {index + 1}
                              </span>
                              {question.prompt}
                            </legend>

                            <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                              {question.options.map((option) => {
                                const isSelected =
                                  selectedOptionId === option.id;
                                return (
                                  <label
                                    key={option.id}
                                    className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)] ${
                                      isSelected
                                        ? "border-[var(--stage-discover-ink)] bg-[var(--stage-discover-bg)] font-semibold text-[var(--stage-discover-ink)] ring-1 ring-[var(--stage-discover-ink)]"
                                        : "border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)]"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${question.id}`}
                                      value={option.id}
                                      checked={isSelected}
                                      onChange={() =>
                                        handleSelectAnswer(
                                          question.id,
                                          option.id,
                                        )
                                      }
                                      className="sr-only"
                                    />
                                    <span className="leading-snug">
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

                  {error ? <Alert variant="danger">{error}</Alert> : null}

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      disabled={!allAnswered}
                      onClick={handleGoToStep2}
                      rightIcon={
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      }
                    >
                      Avançar para ponto de partida
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
          <>
            {macroAreas.length === 0 ? (
              <Alert variant="warning">
                Nenhuma macroárea cadastrada no momento.
              </Alert>
            ) : (
              <div className="space-y-4">
                {macroAreas.map((area) => {
                  const selectedLevel = selfPractice[area.slug];
                  return (
                    <Card key={area.id} as="div" className="p-6 sm:p-7">
                      <fieldset>
                        <legend className="font-display text-base font-semibold text-[var(--ink-primary)]">
                          {area.name}
                        </legend>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          {area.description}
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          {SELF_PRACTICE_OPTIONS.map((option) => {
                            const isSelected = selectedLevel === option.value;
                            return (
                              <label
                                key={option.value}
                                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-center text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)] ${
                                  isSelected
                                    ? "border-[var(--stage-discover-ink)] bg-[var(--stage-discover-bg)] font-semibold text-[var(--stage-discover-ink)] ring-1 ring-[var(--stage-discover-ink)]"
                                    : "border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`self-practice-${area.slug}`}
                                  value={option.value}
                                  checked={isSelected}
                                  onChange={() =>
                                    setSelfPractice((prev) => ({
                                      ...prev,
                                      [area.slug]: option.value,
                                    }))
                                  }
                                  className="sr-only"
                                />
                                <span>{option.label}</span>
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleBackToScenarios}
                leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              >
                Voltar aos cenários
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={!allAnswered || !allPracticeAnswered}
                leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              >
                {submitting
                  ? "Gerando perfil..."
                  : "Gerar meu perfil de prontidão"}
              </Button>
            </div>
          </>
        )}
        </form>
      </div>
    );
  }

  const chartData = macroAreas.map((area) => ({
    slug: area.slug,
    name: area.name,
    score: result.scores[area.slug] ?? 0,
    provenScore: provenPractice.byArea[area.slug]?.score ?? 0,
  }));

  const topAreaDetails = result.topAreas
    .map((slug) => macroAreaBySlug.get(slug))
    .filter((area): area is MacroAreaSummary => Boolean(area));

  const recommendedTracks = tracks.filter((track) =>
    result.topAreas.includes(track.macroAreaSlug),
  );

  const recommendedChallenges = challenges.filter((challenge) =>
    result.topAreas.includes(challenge.macroAreaSlug),
  );

  const formattedDate = formatDatePtBr(result.completedAt);

  return (
    <div className="space-y-6">
      {header}
      <div className="space-y-8">
        <Card as="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Concluído em {formattedDate}</span>
              </Badge>
              {comparison ? (
                <Badge variant="brand">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    Comparado a {formatDatePtBr(comparison.previousCompletedAt)}
                  </span>
                </Badge>
              ) : null}
            </div>
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

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <AffinityChart data={chartData} />
          </div>

          <div className="space-y-3 lg:col-span-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Suas 3 principais áreas
            </h3>
            {topAreaDetails.map((area, index) => {
              const affinityScore = result.scores[area.slug] ?? 0;
              const provenScore = provenPractice.byArea[area.slug]?.score ?? 0;
              const selfPracticeLevel = result.selfPractice?.[area.slug] ?? null;
              const readiness = resolveAreaReadinessStatus({
                provenScore,
                selfPracticeLevel,
              });
              const areaDelta = comparison?.byArea[area.slug];
              const areaChallenge = challenges.find(
                (challenge) => challenge.macroAreaSlug === area.slug,
              );
              const areaTrack = tracks.find(
                (track) => track.macroAreaSlug === area.slug,
              );

              const ctaHref =
                readiness === "PRONTO_PARA_EXPERIMENTAR"
                  ? areaChallenge
                    ? `/app/experimentar/${areaChallenge.id}`
                    : `/app/experimentar?area=${area.slug}`
                  : areaTrack
                    ? `/app/aprender/${areaTrack.id}`
                    : `/app/aprender?area=${area.slug}`;

              const ctaLabel =
                readiness === "PRONTO_PARA_EXPERIMENTAR"
                  ? "Experimentar desafio"
                  : "Começar trilha";

              return (
                <div
                  key={area.slug}
                  className="space-y-3 rounded-xl border border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)]/35 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[var(--ink-primary)]">
                        {index + 1}. {area.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            readiness === "PRONTO_PARA_EXPERIMENTAR"
                              ? "inline-flex items-center rounded-full border border-[var(--stage-experiment-border)] bg-[var(--stage-experiment-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--stage-experiment-ink)]"
                              : "inline-flex items-center rounded-full border border-[var(--stage-learn-border)] bg-[var(--stage-learn-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--stage-learn-ink)]"
                          }
                        >
                          {readiness === "PRONTO_PARA_EXPERIMENTAR"
                            ? "Pronto para experimentar"
                            : "Potencial para trilha"}
                        </span>

                        {areaDelta?.isNewInTop3 ? (
                          <Badge variant="brand">Novo no Top 3</Badge>
                        ) : null}

                        {areaDelta && areaDelta.delta !== null ? (
                          <span
                            className={`font-mono text-xs font-semibold tabular-nums ${
                              areaDelta.delta > 0
                                ? "text-[var(--status-success-ink)]"
                                : areaDelta.delta < 0
                                  ? "text-[var(--status-danger-ink)]"
                                  : "text-[var(--ink-muted)]"
                            }`}
                          >
                            {areaDelta.delta > 0
                              ? `+${areaDelta.delta}`
                              : areaDelta.delta}{" "}
                            pts
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--bg-surface)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--ink-secondary)] tabular-nums">
                        Prática: {provenScore}%
                      </span>
                      <span className="rounded-full bg-[var(--stage-discover-ink)] px-2.5 py-0.5 font-mono text-xs font-bold text-white tabular-nums">
                        {affinityScore}%
                      </span>
                    </div>
                  </div>

                  {area.entryRoles.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {area.entryRoles.map((role) => (
                        <Badge key={role} variant="neutral">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div>
                    <ButtonLink
                      href={ctaHref}
                      variant="secondary"
                      size="sm"
                      rightIcon={
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      }
                    >
                      {ctaLabel}
                    </ButtonLink>
                  </div>
                </div>
              );
            })}
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
                    rightIcon={
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    }
                  >
                    Abrir trilha
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-[var(--ink-primary)]">
            Desafios recomendados para você
          </h2>
          <ButtonLink
            href="/app/experimentar"
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            Ver todos
          </ButtonLink>
        </div>

        {recommendedChallenges.length === 0 ? (
          <EmptyState
            icon={<Rocket className="h-5 w-5" />}
            title="Nenhum desafio publicado para suas áreas de destaque no momento."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedChallenges.map((challenge) => (
              <Card
                key={challenge.id}
                as="article"
                variant="interactive"
                padding="sm"
                className="flex flex-col justify-between gap-4 p-5"
              >
                <div className="space-y-2.5">
                  <Badge variant="neutral">{challenge.macroAreaName}</Badge>
                  <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
                    {challenge.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-[var(--ink-muted)]">
                    {challenge.description}
                  </p>
                </div>

                <div>
                  <ButtonLink
                    href={`/app/experimentar/${challenge.id}`}
                    variant="secondary"
                    size="sm"
                    rightIcon={
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    }
                  >
                    Abrir desafio
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
