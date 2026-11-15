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
      "bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)] border-[var(--stage-discover-border)]",
    Icon: Compass,
  },
  APRENDER: {
    defaultLabel: "Aprender",
    classes:
      "bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)] border-[var(--stage-learn-border)]",
    Icon: BookOpen,
  },
  EXPERIMENTAR: {
    defaultLabel: "Experimentar",
    classes:
      "bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)] border-[var(--stage-experiment-border)]",
    Icon: FlaskConical,
  },
  CONSTRUIR: {
    defaultLabel: "Construir",
    classes:
      "bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)] border-[var(--stage-build-border)]",
    Icon: Hammer,
  },
};

export interface StagePillProps {
  stage: StageKey;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function StagePill({
  stage,
  label,
  showIcon = true,
  className,
}: StagePillProps) {
  const { defaultLabel, classes, Icon } = STAGE_CONFIG[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        classes,
        className,
      )}
    >
      {showIcon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
