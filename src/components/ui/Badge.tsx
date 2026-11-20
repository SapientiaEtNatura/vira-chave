import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "discover"
  | "learn"
  | "experiment"
  | "build";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    "bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] border-[color-mix(in_srgb,var(--ink-muted)_20%,var(--border-subtle))]",
  brand:
    "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[color-mix(in_srgb,var(--brand-primary)_24%,var(--brand-primary-border))]",
  success:
    "bg-[var(--status-success-bg)] text-[var(--status-success-ink)] border-[color-mix(in_srgb,var(--status-success-ink)_26%,var(--status-success-border))]",
  warning:
    "bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)] border-[color-mix(in_srgb,var(--status-warning-ink)_26%,var(--status-warning-border))]",
  danger:
    "bg-[var(--status-danger-bg)] text-[var(--status-danger-ink)] border-[color-mix(in_srgb,var(--status-danger-ink)_24%,var(--status-danger-border))]",
  discover:
    "bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)] border-[color-mix(in_srgb,var(--stage-discover-ink)_24%,var(--stage-discover-border))]",
  learn:
    "bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)] border-[color-mix(in_srgb,var(--stage-learn-ink)_24%,var(--stage-learn-border))]",
  experiment:
    "bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)] border-[color-mix(in_srgb,var(--stage-experiment-ink)_26%,var(--stage-experiment-border))]",
  build:
    "bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)] border-[color-mix(in_srgb,var(--stage-build-ink)_26%,var(--stage-build-border))]",
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--ink-muted)]",
  brand: "bg-[var(--brand-primary)]",
  success: "bg-[var(--status-success-solid)]",
  warning: "bg-[var(--status-warning-solid)]",
  danger: "bg-[var(--status-danger-solid)]",
  discover: "bg-[var(--stage-discover-ink)]",
  learn: "bg-[var(--stage-learn-ink)]",
  experiment: "bg-[var(--stage-experiment-ink)]",
  build: "bg-[var(--stage-build-ink)]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  icon?: React.ReactNode;
  mono?: boolean;
  size?: "sm" | "md";
}

export function Badge({
  variant = "neutral",
  dot = false,
  icon,
  mono = false,
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-[1.5px] font-semibold leading-none tracking-tight select-none",
        size === "md"
          ? "gap-1.5 px-3 py-1.5 text-xs"
          : "gap-1.5 px-2.5 py-1 text-xs",
        mono ? "font-mono tabular-nums" : "font-sans",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASSES[variant])}
        />
      ) : null}
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
