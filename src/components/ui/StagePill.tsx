import { BookOpen, Compass, FlaskConical, Hammer } from "lucide-react";
import { cn } from "@/lib/cn";

export type StageKey = "DESCOBRIR" | "APRENDER" | "EXPERIMENTAR" | "CONSTRUIR";

const STAGE_CONFIG: Record<
  StageKey,
  {
    defaultLabel: string;
    classes: string;
    Icon: typeof Compass;
  }
> = {
  DESCOBRIR: {
    defaultLabel: "Descobrir",
    classes:
      "bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)] border-[color-mix(in_srgb,var(--stage-discover-ink)_24%,var(--stage-discover-border))]",
    Icon: Compass,
  },
  APRENDER: {
    defaultLabel: "Aprender",
    classes:
      "bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)] border-[color-mix(in_srgb,var(--stage-learn-ink)_24%,var(--stage-learn-border))]",
    Icon: BookOpen,
  },
  EXPERIMENTAR: {
    defaultLabel: "Experimentar",
    classes:
      "bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)] border-[color-mix(in_srgb,var(--stage-experiment-ink)_26%,var(--stage-experiment-border))]",
    Icon: FlaskConical,
  },
  CONSTRUIR: {
    defaultLabel: "Construir",
    classes:
      "bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)] border-[color-mix(in_srgb,var(--stage-build-ink)_26%,var(--stage-build-border))]",
    Icon: Hammer,
  },
};

export interface StagePillProps {
  stage: StageKey;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StagePill({
  stage,
  label,
  showIcon = true,
  size = "sm",
  className,
}: StagePillProps) {
  const { defaultLabel, classes, Icon } = STAGE_CONFIG[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-[1.5px] font-semibold leading-none tracking-tight select-none",
        size === "md"
          ? "gap-1.5 px-3 py-1.5 text-xs"
          : "gap-1.5 px-2.5 py-1 text-xs",
        classes,
        className,
      )}
    >
      {showIcon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
