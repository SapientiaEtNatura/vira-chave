import { cn } from "@/lib/cn";

export type ProgressTone =
  | "brand"
  | "discover"
  | "learn"
  | "experiment"
  | "build";

const TONE_CLASSES: Record<ProgressTone, string> = {
  brand: "bg-[var(--brand-primary)]",
  discover: "bg-[var(--stage-discover-ink)]",
  learn: "bg-[var(--stage-learn-ink)]",
  experiment: "bg-[var(--stage-experiment-ink)]",
  build: "bg-[var(--stage-build-ink)]",
};

export interface ProgressProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
  tone?: ProgressTone;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  tone = "brand",
  className,
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.min(Math.max(0, value), safeMax);
  const percentage = Math.round((clampedValue / safeMax) * 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      {showValue ? (
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--ink-secondary)]">
          <span>{label}</span>
          <span className="font-mono tabular-nums">{percentage}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            TONE_CLASSES[tone],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
