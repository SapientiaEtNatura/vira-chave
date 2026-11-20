import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "block w-full min-h-11 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--ink-primary)]",
          "transition-colors hover:border-[var(--border-strong)]",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-transparent focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30",
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-subtle)] disabled:text-[var(--ink-muted)]",
          "aria-[invalid=true]:border-[var(--status-danger-solid)] aria-[invalid=true]:focus-visible:ring-[var(--status-danger-solid)]/30",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
