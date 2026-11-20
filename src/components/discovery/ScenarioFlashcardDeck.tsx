"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { gsap, MOTION_EASE, useGSAP } from "@/lib/gsap";
import type { QuizQuestionItem } from "./DiscoveryQuizClient";

export interface VisibleDeckSlice<T> {
  index: number;
  front: T | null;
  mid: T | null;
  back: T | null;
}

export interface DeckNavigationState<T> {
  index: number;
  total: number;
  currentQuestion: T | null;
  selectedOptionId: string | undefined;
  canGoBack: boolean;
  canAdvance: boolean;
  isLastCard: boolean;
}

export function clampDeckIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(0, index), length - 1);
}

export function getVisibleDeckSlice<T>(
  questions: readonly T[],
  activeIndex: number,
): VisibleDeckSlice<T> {
  if (questions.length === 0) {
    return { index: 0, front: null, mid: null, back: null };
  }

  const index = clampDeckIndex(activeIndex, questions.length);
  return {
    index,
    front: questions[index] ?? null,
    mid: questions[index + 1] ?? null,
    back: questions[index + 2] ?? null,
  };
}

export function getDeckNavigationState(
  questions: readonly QuizQuestionItem[],
  answers: Readonly<Record<string, string>>,
  activeIndex: number,
): DeckNavigationState<QuizQuestionItem> {
  const total = questions.length;
  if (total === 0) {
    return {
      index: 0,
      total: 0,
      currentQuestion: null,
      selectedOptionId: undefined,
      canGoBack: false,
      canAdvance: false,
      isLastCard: false,
    };
  }

  const index = clampDeckIndex(activeIndex, total);
  const currentQuestion = questions[index] ?? null;
  const selectedOptionId = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  return {
    index,
    total,
    currentQuestion,
    selectedOptionId,
    canGoBack: index > 0,
    canAdvance: Boolean(selectedOptionId),
    isLastCard: index === total - 1,
  };
}

function shouldReduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface ScenarioFlashcardDeckProps {
  questions: QuizQuestionItem[];
  answers: Record<string, string>;
  activeIndex: number;
  onActiveIndexChange: (nextIndex: number) => void;
  onSelectAnswer: (questionId: string, optionId: string) => void;
  onCompleteScenarios: () => void;
}

export function ScenarioFlashcardDeck({
  questions,
  answers,
  activeIndex,
  onActiveIndexChange,
  onSelectAnswer,
  onCompleteScenarios,
}: ScenarioFlashcardDeckProps) {
  const deckScopeRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const midCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLFieldSetElement>(null);
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionDirRef = useRef<"initial" | "next" | "prev">("initial");
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasInteractedRef = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { front, mid, back, index } = getVisibleDeckSlice(
    questions,
    activeIndex,
  );
  const { total, selectedOptionId, canGoBack, canAdvance, isLastCard } =
    getDeckNavigationState(questions, answers, index);

  useEffect(() => {
    return () => {
      activeTimelineRef.current?.kill();
    };
  }, []);

  // Restaura o foco para o novo cenário após avançar/voltar (evita perda para document.body)
  const frontId = front?.id;
  useEffect(() => {
    if (!hasInteractedRef.current || !frontId) return;
    frontCardRef.current?.focus({ preventScroll: true });
  }, [frontId]);

  useGSAP(
    () => {
      if (!front) return;

      const direction = transitionDirRef.current;
      transitionDirRef.current = "initial";
      setIsAnimating(false);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const frontEl = frontCardRef.current;
        const midEl = midCardRef.current;
        const backEl = backCardRef.current;
        const optionItems =
          optionsRef.current?.querySelectorAll<HTMLElement>(
            "[data-option-item]",
          );

        if (direction === "next") {
          if (frontEl) {
            gsap.fromTo(
              frontEl,
              { y: -10, scale: 0.96, opacity: 0.85 },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.42,
                ease: MOTION_EASE.emphasis,
                clearProps: "transform,opacity",
              },
            );
          }
          if (midEl) {
            gsap.fromTo(
              midEl,
              { y: -16, scale: 0.9 },
              {
                y: -9,
                scale: 0.94,
                duration: 0.42,
                ease: MOTION_EASE.enter,
              },
            );
          }
          if (backEl) {
            gsap.fromTo(
              backEl,
              { y: -22, scale: 0.84, opacity: 0 },
              {
                y: -18,
                scale: 0.88,
                opacity: 1,
                duration: 0.42,
                ease: MOTION_EASE.enter,
                clearProps: "opacity",
              },
            );
          }
        } else if (direction === "prev") {
          if (frontEl) {
            gsap.fromTo(
              frontEl,
              { x: "-105%", rotation: -5, opacity: 0 },
              {
                x: 0,
                rotation: 0,
                opacity: 1,
                duration: 0.48,
                ease: MOTION_EASE.emphasis,
                clearProps: "transform,opacity",
              },
            );
          }
          if (midEl) {
            gsap.fromTo(
              midEl,
              { y: 0, scale: 1 },
              {
                y: -9,
                scale: 0.94,
                duration: 0.42,
                ease: MOTION_EASE.enter,
              },
            );
          }
        }

        if (optionItems && optionItems.length > 0) {
          gsap.fromTo(
            optionItems,
            { y: 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.07,
              ease: MOTION_EASE.emphasis,
              clearProps: "transform,opacity",
            },
          );
        }
      });
    },
    { scope: deckScopeRef, dependencies: [front?.id] },
  );

  if (!front) return null;

  function handleAdvance() {
    if (!canAdvance || isAnimating) return;
    hasInteractedRef.current = true;

    if (shouldReduceMotion()) {
      if (isLastCard) {
        onCompleteScenarios();
      } else {
        transitionDirRef.current = "next";
        onActiveIndexChange(index + 1);
      }
      return;
    }

    setIsAnimating(true);
    activeTimelineRef.current?.kill();

    const frontEl = frontCardRef.current;
    const midEl = midCardRef.current;
    const backEl = backCardRef.current;
    const optionItems =
      optionsRef.current?.querySelectorAll<HTMLElement>("[data-option-item]");

    const tl = gsap.timeline({
      onComplete: () => {
        if (isLastCard) {
          setIsAnimating(false);
          onCompleteScenarios();
        } else {
          transitionDirRef.current = "next";
          onActiveIndexChange(index + 1);
        }
      },
    });

    if (frontEl) {
      tl.to(
        frontEl,
        {
          x: "-115%",
          rotation: -6,
          opacity: 0,
          duration: 0.48,
          ease: "power2.inOut",
        },
        0,
      );
    }

    if (optionItems && optionItems.length > 0) {
      tl.to(
        optionItems,
        {
          y: 12,
          opacity: 0,
          duration: 0.26,
          stagger: 0.03,
          ease: "power2.inOut",
        },
        0,
      );
    }

    if (midEl) {
      tl.to(
        midEl,
        {
          y: 0,
          scale: 1,
          duration: 0.44,
          ease: MOTION_EASE.enter,
        },
        0.06,
      );
    }

    if (backEl) {
      tl.to(
        backEl,
        {
          y: -9,
          scale: 0.94,
          duration: 0.44,
          ease: MOTION_EASE.enter,
        },
        0.06,
      );
    }

    activeTimelineRef.current = tl;
  }

  function handleBack() {
    if (!canGoBack || isAnimating) return;
    hasInteractedRef.current = true;

    if (shouldReduceMotion()) {
      transitionDirRef.current = "prev";
      onActiveIndexChange(index - 1);
      return;
    }

    setIsAnimating(true);
    activeTimelineRef.current?.kill();

    const optionItems =
      optionsRef.current?.querySelectorAll<HTMLElement>("[data-option-item]");

    const tl = gsap.timeline({
      onComplete: () => {
        transitionDirRef.current = "prev";
        onActiveIndexChange(index - 1);
      },
    });

    if (optionItems && optionItems.length > 0) {
      tl.to(
        optionItems,
        {
          y: 12,
          opacity: 0,
          duration: 0.22,
          ease: "power2.inOut",
        },
        0,
      );
    }

    activeTimelineRef.current = tl;
  }

  function handleDeckKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowRight" && canAdvance && !isAnimating) {
      event.preventDefault();
      handleAdvance();
    } else if (event.key === "ArrowLeft" && canGoBack && !isAnimating) {
      event.preventDefault();
      handleBack();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || isAnimating) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return;

    if (dx < 0 && canAdvance) {
      handleAdvance();
    } else if (dx > 0 && canGoBack) {
      handleBack();
    }
  }

  return (
    <div
      ref={deckScopeRef}
      onKeyDown={handleDeckKeyDown}
      className="relative mx-auto w-full min-w-0 max-w-lg space-y-4 overflow-x-clip"
    >
      <div role="status" aria-live="polite" className="sr-only">
        Cenário {index + 1} de {total}: {front.prompt}
      </div>

      {/* Pilha de flashcards: até 2 camadas coloridas espiando atrás do cenário ativo */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStartRef.current = null;
        }}
        className="relative mx-auto w-full touch-pan-y pt-5"
      >
        {back ? (
          <div
            key={`back-${back.id}`}
            ref={backCardRef}
            aria-hidden="true"
            style={{ transform: "translateY(-18px) scale(0.88)" }}
            className="pointer-events-none absolute inset-x-0 top-5 bottom-0 z-10 origin-top rounded-2xl bg-[var(--stage-learn-ink)] shadow-sm"
          />
        ) : null}

        {mid ? (
          <div
            key={`mid-${mid.id}`}
            ref={midCardRef}
            aria-hidden="true"
            style={{ transform: "translateY(-9px) scale(0.94)" }}
            className="pointer-events-none absolute inset-x-0 top-5 bottom-0 z-20 origin-top rounded-2xl bg-[var(--stage-discover-ink)] shadow-md"
          />
        ) : null}

        <div
          key={front.id}
          ref={frontCardRef}
          tabIndex={-1}
          className="relative z-30 flex min-h-[124px] flex-col justify-between gap-3 rounded-2xl bg-[var(--brand-primary-deep)] p-5 text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-white/12 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-[var(--brand-primary-ink-on-dark)] tabular-nums">
              Cenário {String(index + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>

            {selectedOptionId ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
                <Check className="h-3 w-3" aria-hidden="true" />
                Selecionada
              </span>
            ) : null}
          </div>

          <p className="font-display text-base font-semibold leading-snug text-white">
            {front.prompt}
          </p>
        </div>
      </div>

      {/* Opções de resposta abaixo do baralho com entrada suave de baixo para cima */}
      <fieldset
        key={front.id}
        ref={optionsRef}
        className="relative min-w-0 space-y-2"
      >
        <legend className="sr-only">{front.prompt}</legend>

        {front.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <label
              key={option.id}
              data-option-item
              className={`relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] leading-snug transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)] ${
                isSelected
                  ? "border-[var(--stage-discover-ink)] bg-[var(--stage-discover-bg)] font-semibold text-[var(--stage-discover-ink)] ring-1 ring-[var(--stage-discover-ink)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)]/60"
              } ${isAnimating ? "pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                name={`question-${front.id}`}
                value={option.id}
                checked={isSelected}
                disabled={isAnimating}
                onChange={() => onSelectAnswer(front.id, option.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-[var(--stage-discover-ink)] bg-[var(--stage-discover-ink)] text-white"
                    : "border-[var(--border-strong)] bg-white"
                }`}
              >
                {isSelected ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              <span>{option.label}</span>
            </label>
          );
        })}
      </fieldset>

      {/* Confirmação explícita (Voltar / Avançar) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={!canGoBack || isAnimating}
          onClick={handleBack}
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Voltar
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!canAdvance || isAnimating}
          onClick={handleAdvance}
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {isLastCard ? "Definir ponto de partida" : "Avançar"}
        </Button>
      </div>
    </div>
  );
}
