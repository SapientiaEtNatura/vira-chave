import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { StagePill, type StageKey } from "./StagePill";

const STAGE_BANNER_STYLES: Record<
  StageKey,
  { container: string; subtitle: string; ring: string }
> = {
  DESCOBRIR: {
    container:
      "border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)]/55",
    subtitle: "text-[var(--ink-secondary)]",
    ring: "border-[var(--stage-discover-border)]",
  },
  APRENDER: {
    container:
      "border-[var(--stage-learn-border)] bg-[var(--stage-learn-bg)]/55",
    subtitle: "text-[var(--ink-secondary)]",
    ring: "border-[var(--stage-learn-border)]",
  },
  EXPERIMENTAR: {
    container:
      "border-[var(--stage-experiment-border)] bg-[var(--stage-experiment-bg)]/55",
    subtitle: "text-[var(--ink-secondary)]",
    ring: "border-[var(--stage-experiment-border)]",
  },
  CONSTRUIR: {
    container:
      "border-[var(--stage-build-border)] bg-[var(--stage-build-bg)]/55",
    subtitle: "text-[var(--ink-secondary)]",
    ring: "border-[var(--stage-build-border)]",
  },
};

export interface StageBannerProps {
  stage: StageKey;
  stageLabel?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  bottomSlot?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho temático de etapa para as quatro fases da jornada do estudante.
 */
export function StageBanner({
  stage,
  stageLabel,
  title,
  subtitle,
  actions,
  bottomSlot,
  className,
}: StageBannerProps) {
  const styles = STAGE_BANNER_STYLES[stage];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 sm:p-7",
        styles.container,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border opacity-60",
          styles.ring,
        )}
      />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2.5">
          <StagePill stage={stage} label={stageLabel} showIcon />
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink-primary)] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className={cn("max-w-[60ch] text-sm leading-relaxed", styles.subtitle)}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {bottomSlot ? (
        <div className="relative z-10 mt-4 border-t border-[var(--border-subtle)]/80 pt-4">
          {bottomSlot}
        </div>
      ) : null}
    </section>
  );
}
