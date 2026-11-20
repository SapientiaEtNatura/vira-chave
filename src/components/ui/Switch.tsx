"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  className?: string;
}

/**
 * Interruptor acessível com alvo de toque ≥44px para controles booleanos.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      id,
      checked,
      onCheckedChange,
      disabled = false,
      label,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      className,
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabelledBy ? ariaLabel : (ariaLabel ?? label)}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "inline-flex min-h-11 min-w-12 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
            checked
              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
              : "border-[var(--border-strong)] bg-[var(--bg-surface-subtle)]",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-[var(--bg-surface)] shadow-sm transition-transform",
              checked ? "translate-x-6" : "translate-x-1",
            )}
          />
        </span>
      </button>
    );
  },
);
