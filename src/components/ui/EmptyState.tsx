import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  as?: "h2" | "h3";
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  as: Heading = "h3",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-subtle)] text-[var(--ink-muted)]"
        >
          {icon}
        </div>
      ) : null}
      <Heading className="font-display text-base font-semibold text-[var(--ink-primary)]">
        {title}
      </Heading>
      {description ? (
        <p className="mt-1.5 max-w-[52ch] text-sm text-[var(--ink-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
