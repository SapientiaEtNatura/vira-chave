import * as React from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block w-full min-h-[104px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--ink-primary)]",
          "placeholder:text-[var(--ink-muted)] transition-colors",
          "hover:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30",
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-subtle)] disabled:text-[var(--ink-muted)]",
          "aria-[invalid=true]:border-[var(--status-danger-solid)] aria-[invalid=true]:focus-visible:ring-[var(--status-danger-solid)]/30",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
