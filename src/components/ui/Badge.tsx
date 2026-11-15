import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    "bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-subtle)]",
  brand:
    "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary-border)]",
  success:
    "bg-[var(--status-success-bg)] text-[var(--status-success-ink)] border-[var(--status-success-border)]",
  warning:
    "bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)] border-[var(--status-warning-border)]",
  danger:
    "bg-[var(--status-danger-bg)] text-[var(--status-danger-ink)] border-[var(--status-danger-border)]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
