"use client";

import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FlaskConical,
  Rocket,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Alert,
  Badge,
  type BadgeVariant,
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

const AffinityChart = dynamic(
  () =>
    import("@/components/discovery/AffinityChart").then(
      (mod) => mod.AffinityChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-72 w-full animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70 sm:h-[22rem]"
      />
    ),
  },
);

const ScenarioFlashcardDeck = dynamic(
  () =>
    import("@/components/discovery/ScenarioFlashcardDeck").then(
      (mod) => mod.ScenarioFlashcardDeck,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="mx-auto h-[420px] w-full max-w-lg animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70"
      />
    ),
  },
);

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

export type DiscoverySoftPillTone = BadgeVariant;

export interface DiscoverySoftPillProps {
  tone?: DiscoverySoftPillTone;
  icon?: ReactNode;
  mono?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}

export function DiscoverySoftPill({
  tone = "neutral",
  icon,
  mono = false,
  size = "sm",
  className,
  children,
}: DiscoverySoftPillProps) {
  return (
    <Badge
      variant={tone}
      icon={icon}
      mono={mono}
      size={size}
      className={className}
    >
      {children}
    </Badge>
  );
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
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllChallenges, setShowAllChallenges] = useState(false);

  const DRAFT_STORAGE_KEY = "virachave:discovery-draft:v1";

  useEffect(() => {
    if (!isRetaking) return;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        answers?: Record<string, string>;
        selfPractice?: Record<string, SelfPracticeLevel>;
        step?: 1 | 2;
        activeScenarioIndex?: number;
      };
      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        setAnswers(parsed.answers);
      }
      if (parsed.selfPractice && Object.keys(parsed.selfPractice).length > 0) {
        setSelfPractice(parsed.selfPractice);
      }
      if (parsed.step === 1 || parsed.step === 2) {
        setStep(parsed.step);
      }
      if (typeof parsed.activeScenarioIndex === "number") {
        setActiveScenarioIndex(parsed.activeScenarioIndex);
      }
    } catch {
      // Ignora falhas de leitura do rascunho local
    }
  }, [isRetaking]);

  useEffect(() => {
    if (!isRetaking) return;
    if (
      Object.keys(answers).length === 0 &&
      Object.keys(selfPractice).length === 0
    ) {
      return;
    }
    try {
      window.sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ answers, selfPractice, step, activeScenarioIndex }),
      );
    } catch {
      // Ignora falhas de persistência local
    }
  }, [isRetaking, answers, selfPractice, step, activeScenarioIndex]);

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
      setError("Informe seu ponto de partida para todas as áreas.");
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
      try {
        window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup error
      }
      router.refresh();
    } catch {
      setError("Erro de conexão ao salvar seu mapeamento. Tente novamente.");
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
    try {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup error
    }
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
      <div className="relative min-w-0 space-y-6">
        {header ? <div className="hidden lg:block">{header}</div> : null}
        <h1 className="sr-only lg:hidden">Descubra suas afinidades</h1>

        <form onSubmit={handleSubmit} className="min-w-0 space-y-4 lg:space-y-6">
          {showMobileDeck ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DiscoverySoftPill
                  tone="discover"
                  icon={<Compass className="h-3.5 w-3.5" />}
                >
                  Passo 1 de 2 · {answeredCount}/{questions.length} respondidos
                </DiscoverySoftPill>

                {result ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11 px-3 text-xs"
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
                  <DiscoverySoftPill tone="neutral" mono>
                    {scenarioPercent}%
                  </DiscoverySoftPill>
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
                <div className="flex flex-wrap items-center gap-2.5">
                  <DiscoverySoftPill
                    tone="discover"
                    size="md"
                    icon={<Compass className="h-3.5 w-3.5" />}
                  >
                    {step === 1
                      ? "Passo 1 de 2 · Cenários situacionais"
                      : "Passo 2 de 2 · Ponto de partida"}
                  </DiscoverySoftPill>
                  <DiscoverySoftPill tone="neutral" mono>
                    {step === 1
                      ? `${answeredCount} de ${questions.length} cenários respondidos`
                      : `${practiceCount} de ${macroAreas.length} áreas preenchidas`}
                  </DiscoverySoftPill>
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
                          <fieldset className="min-w-0">
                            <legend className="font-display text-base font-semibold leading-snug text-[var(--ink-primary)]">
                              <span className="mr-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--stage-discover-ink)_24%,var(--stage-discover-border))] bg-[var(--stage-discover-bg)] font-mono text-xs font-bold text-[var(--stage-discover-ink)]">
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
                                    className={`relative flex min-h-11 cursor-pointer items-center rounded-xl border-[1.5px] px-4 py-3 text-left text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)] ${
                                      isSelected
                                        ? "border-[color-mix(in_srgb,var(--stage-discover-ink)_42%,var(--stage-discover-border))] bg-[var(--stage-discover-bg)] font-semibold text-[var(--stage-discover-ink)]"
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
                      <fieldset className="min-w-0">
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
                                className={`relative flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-[1.5px] px-3 py-2.5 text-center text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)] ${
                                  isSelected
                                    ? "border-[color-mix(in_srgb,var(--stage-discover-ink)_42%,var(--stage-discover-border))] bg-[var(--stage-discover-bg)] font-semibold text-[var(--stage-discover-ink)]"
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
    <div className="relative min-w-0 space-y-6">
      {header}
      <div className="min-w-0 space-y-8">
        <Card as="section" className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <DiscoverySoftPill
                  tone="success"
                  size="md"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Concluído em {formattedDate}
                </DiscoverySoftPill>
                {comparison ? (
                  <DiscoverySoftPill
                    tone="brand"
                    size="md"
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                  >
                    Comparado a {formatDatePtBr(comparison.previousCompletedAt)}
                  </DiscoverySoftPill>
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
              Refazer mapeamento
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6">
              <AffinityChart data={chartData} />
            </div>

            <div className="min-w-0 space-y-3.5 lg:col-span-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
                  Suas 3 principais áreas
                </h3>
                <DiscoverySoftPill tone="discover" mono>
                  Top 3
                </DiscoverySoftPill>
              </div>
              {topAreaDetails.map((area, index) => {
                const affinityScore = result.scores[area.slug] ?? 0;
                const provenScore = provenPractice.byArea[area.slug]?.score ?? 0;
                const selfPracticeLevel =
                  result.selfPractice?.[area.slug] ?? null;
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
                    className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/45 p-4 transition-colors hover:border-[var(--border-strong)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <DiscoverySoftPill tone="discover" mono>
                            #{index + 1}
                          </DiscoverySoftPill>
                          <p className="font-display text-sm font-bold text-[var(--ink-primary)]">
                            {area.name}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {readiness === "PRONTO_PARA_EXPERIMENTAR" ? (
                            <DiscoverySoftPill
                              tone="experiment"
                              icon={<FlaskConical className="h-3.5 w-3.5" />}
                            >
                              Pronto para experimentar
                            </DiscoverySoftPill>
                          ) : (
                            <DiscoverySoftPill
                              tone="learn"
                              icon={<BookOpen className="h-3.5 w-3.5" />}
                            >
                              Potencial para trilha
                            </DiscoverySoftPill>
                          )}

                          {areaDelta?.isNewInTop3 ? (
                            <DiscoverySoftPill
                              tone="brand"
                              icon={<Sparkles className="h-3.5 w-3.5" />}
                            >
                              Novo no Top 3
                            </DiscoverySoftPill>
                          ) : null}

                          {areaDelta && areaDelta.delta !== null ? (
                            <DiscoverySoftPill
                              tone={
                                areaDelta.delta > 0 ? "success" : "neutral"
                              }
                              mono
                            >
                              {areaDelta.delta > 0
                                ? `+${areaDelta.delta}`
                                : areaDelta.delta}{" "}
                              pts
                            </DiscoverySoftPill>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <DiscoverySoftPill tone="neutral" mono>
                          Prática: {provenScore}%
                        </DiscoverySoftPill>
                        <DiscoverySoftPill tone="discover" mono>
                          {affinityScore}%
                        </DiscoverySoftPill>
                      </div>
                    </div>

                    {area.entryRoles.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {area.entryRoles.map((role) => (
                          <DiscoverySoftPill key={role} tone="neutral">
                            {role}
                          </DiscoverySoftPill>
                        ))}
                      </div>
                    ) : null}

                    <div>
                      <ButtonLink
                        href={ctaHref}
                        variant="secondary"
                        size="sm"
                        rightIcon={
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
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

        {(() => {
          const primaryArea = topAreaDetails[0];
          if (!primaryArea) return null;
          const primaryProven =
            provenPractice.byArea[primaryArea.slug]?.score ?? 0;
          const primarySelf = result.selfPractice?.[primaryArea.slug] ?? null;
          const primaryReadiness = resolveAreaReadinessStatus({
            provenScore: primaryProven,
            selfPracticeLevel: primarySelf,
          });
          const primaryTrack = recommendedTracks.find(
            (track) => track.macroAreaSlug === primaryArea.slug,
          );
          const primaryChallenge = recommendedChallenges.find(
            (challenge) => challenge.macroAreaSlug === primaryArea.slug,
          );
          const startHref =
            primaryReadiness === "PRONTO_PARA_EXPERIMENTAR" && primaryChallenge
              ? `/app/experimentar/${primaryChallenge.id}`
              : primaryTrack
                ? `/app/aprender/${primaryTrack.id}`
                : `/app/aprender?area=${primaryArea.slug}`;
          const startAction =
            primaryReadiness === "PRONTO_PARA_EXPERIMENTAR" && primaryChallenge
              ? `Experimentar: ${primaryChallenge.title}`
              : primaryTrack
                ? `Começar trilha: ${primaryTrack.title}`
                : `Explorar ${primaryArea.name}`;

          return (
            <Card
              as="section"
              variant="highlight"
              aria-labelledby="primary-next-step-heading"
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <DiscoverySoftPill
                    tone="brand"
                    size="md"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Comece por aqui · Área #1 ({primaryArea.name})
                  </DiscoverySoftPill>
                </div>
                <h2
                  id="primary-next-step-heading"
                  className="font-display text-lg font-bold text-[var(--ink-primary)]"
                >
                  {startAction}
                </h2>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Em vez de tentar tudo de uma vez, dê este primeiro passo e
                  volte ao mapa quando concluir.
                </p>
              </div>
              <ButtonLink
                href={startHref}
                variant="primary"
                size="md"
                rightIcon={
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                }
                className="shrink-0"
              >
                Iniciar agora
              </ButtonLink>
            </Card>
          );
        })()}

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
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(showAllTracks
                  ? recommendedTracks
                  : recommendedTracks.slice(0, 3)
                ).map((track) => (
                  <Card
                    key={track.id}
                    as="article"
                    variant="interactive"
                    padding="sm"
                    className="flex flex-col justify-between gap-4 p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <DiscoverySoftPill
                          tone="learn"
                          icon={<BookOpen className="h-3.5 w-3.5" />}
                        >
                          {track.macroAreaName}
                        </DiscoverySoftPill>
                        <DiscoverySoftPill tone="neutral" mono>
                          {track.courseCount}{" "}
                          {track.courseCount === 1 ? "curso" : "cursos"}
                        </DiscoverySoftPill>
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
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        }
                      >
                        Abrir trilha
                      </ButtonLink>
                    </div>
                  </Card>
                ))}
              </div>
              {recommendedTracks.length > 3 ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllTracks((prev) => !prev)}
                  >
                    {showAllTracks
                      ? "Mostrar menos trilhas"
                      : `Ver mais ${recommendedTracks.length - 3} trilhas recomendadas`}
                  </Button>
                </div>
              ) : null}
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(showAllChallenges
                  ? recommendedChallenges
                  : recommendedChallenges.slice(0, 3)
                ).map((challenge) => (
                  <Card
                    key={challenge.id}
                    as="article"
                    variant="interactive"
                    padding="sm"
                    className="flex flex-col justify-between gap-4 p-5"
                  >
                    <div className="space-y-3">
                      <div>
                        <DiscoverySoftPill
                          tone="experiment"
                          icon={<FlaskConical className="h-3.5 w-3.5" />}
                        >
                          {challenge.macroAreaName}
                        </DiscoverySoftPill>
                      </div>
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
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        }
                      >
                        Abrir desafio
                      </ButtonLink>
                    </div>
                  </Card>
                ))}
              </div>
              {recommendedChallenges.length > 3 ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllChallenges((prev) => !prev)}
                  >
                    {showAllChallenges
                      ? "Mostrar menos desafios"
                      : `Ver mais ${recommendedChallenges.length - 3} desafios recomendados`}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
