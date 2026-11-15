import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { StageKey } from "./StagePill";

export type JourneyStepStatus = "complete" | "current" | "upcoming";

export interface JourneyBarStep {
  key: StageKey;
  label: string;
  href: string;
  status: JourneyStepStatus;
}

const DEFAULT_STEPS: Array<{
  key: StageKey;
  number: number;
  label: string;
  href: string;
  completeCircle: string;
  currentCircle: string;
  lineFill: string;
}> = [
  {
    key: "DESCOBRIR",
    number: 1,
    label: "Descobrir",
    href: "/app/descobrir",
    completeCircle: "bg-[var(--stage-discover-ink)] text-white border-[var(--stage-discover-ink)]",
    currentCircle: "border-2 border-[var(--stage-discover-ink)] bg-[var(--bg-surface)] text-[var(--stage-discover-ink)]",
    lineFill: "bg-[var(--stage-discover-ink)]",
  },
  {
    key: "APRENDER",
    number: 2,
    label: "Aprender",
    href: "/app/aprender",
    completeCircle: "bg-[var(--stage-learn-ink)] text-white border-[var(--stage-learn-ink)]",
    currentCircle: "border-2 border-[var(--stage-learn-ink)] bg-[var(--bg-surface)] text-[var(--stage-learn-ink)]",
    lineFill: "bg-[var(--stage-learn-ink)]",
  },
  {
    key: "EXPERIMENTAR",
    number: 3,
    label: "Experimentar",
    href: "/app/experimentar",
    completeCircle: "bg-[var(--stage-experiment-ink)] text-white border-[var(--stage-experiment-ink)]",
    currentCircle: "border-2 border-[var(--stage-experiment-ink)] bg-[var(--bg-surface)] text-[var(--stage-experiment-ink)]",
    lineFill: "bg-[var(--stage-experiment-ink)]",
  },
  {
    key: "CONSTRUIR",
    number: 4,
    label: "Construir",
    href: "/app/portfolio",
    completeCircle: "bg-[var(--stage-build-ink)] text-white border-[var(--stage-build-ink)]",
    currentCircle: "border-2 border-[var(--stage-build-ink)] bg-[var(--bg-surface)] text-[var(--stage-build-ink)]",
    lineFill: "bg-[var(--stage-build-ink)]",
  },
];

export interface JourneyBarProps {
  steps?: JourneyBarStep[];
  currentStage?: StageKey;
  completedStages?: StageKey[];
  className?: string;
}

/**
 * Barra horizontal da jornada em 4 etapas com conectores de progresso entre etapas.
 */
export function JourneyBar({
  steps,
  currentStage = "DESCOBRIR",
  completedStages = [],
  className,
}: JourneyBarProps) {
  const resolvedSteps = DEFAULT_STEPS.map((base) => {
    const custom = steps?.find((s) => s.key === base.key);
    const status: JourneyStepStatus =
      custom?.status ??
      (completedStages.includes(base.key)
        ? "complete"
        : currentStage === base.key
          ? "current"
          : "upcoming");

    return {
      ...base,
      label: custom?.label ?? base.label,
      href: custom?.href ?? base.href,
      status,
    };
  });

  return (
    <nav
      aria-label="Progresso nas 4 etapas da jornada"
      className={cn(
        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6",
        className,
      )}
    >
      <ol className="grid grid-cols-2 gap-4 lg:flex lg:items-center lg:justify-between lg:gap-3">
        {resolvedSteps.map((step, index) => {
          const isCurrent = step.status === "current";
          const isComplete = step.status === "complete";
          const isLast = index === resolvedSteps.length - 1;

          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-3",
                !isLast && "lg:flex-1",
              )}
            >
              <Link
                href={step.href}
                aria-current={isCurrent ? "step" : undefined}
                className="group flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-1.5 py-1 transition-colors hover:bg-[var(--bg-surface-subtle)]/60"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold transition-transform group-hover:scale-105",
                    isComplete
                      ? step.completeCircle
                      : isCurrent
                        ? step.currentCircle
                        : "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink-muted)]",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                    Etapa {step.number}
                  </span>
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      isCurrent || isComplete
                        ? "text-[var(--ink-primary)]"
                        : "text-[var(--ink-secondary)]",
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </Link>

              {!isLast ? (
                <div
                  aria-hidden="true"
                  className="hidden h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-surface-subtle)] lg:block"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isComplete
                        ? cn("w-full", step.lineFill)
                        : isCurrent
                          ? cn("w-1/2", step.lineFill)
                          : "w-0",
                    )}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
