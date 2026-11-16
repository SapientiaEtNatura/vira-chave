import type { ReactNode } from "react";
import { BannerMountains } from "@/components/motion/BannerMountains";
import { cn } from "@/lib/cn";
import { StagePill, type StageKey } from "./StagePill";

const STAGE_BANNER_STYLES: Record<
  StageKey,
  { bg: string; border: string; subtitle: string }
> = {
  DESCOBRIR: {
    bg: "bg-[var(--stage-discover-bg)]/55",
    border: "border-[var(--stage-discover-border)]",
    subtitle: "text-[var(--ink-secondary)]",
  },
  APRENDER: {
    bg: "bg-[var(--stage-learn-bg)]/55",
    border: "border-[var(--stage-learn-border)]",
    subtitle: "text-[var(--ink-secondary)]",
  },
  EXPERIMENTAR: {
    bg: "bg-[var(--stage-experiment-bg)]/55",
    border: "border-[var(--stage-experiment-border)]",
    subtitle: "text-[var(--ink-secondary)]",
  },
  CONSTRUIR: {
    bg: "bg-[var(--stage-build-bg)]/55",
    border: "border-[var(--stage-build-border)]",
    subtitle: "text-[var(--ink-secondary)]",
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
        "relative overflow-hidden rounded-t-2xl px-6 pt-6 pb-14 sm:px-7 sm:pt-7 sm:pb-16",
        styles.bg,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-t-2xl border border-b-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent_95%)]",
          styles.border,
        )}
      />
      <BannerMountains stage={stage} />

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
