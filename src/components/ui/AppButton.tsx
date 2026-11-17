import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] border border-transparent shadow-xs",
  secondary:
    "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] hover:bg-[#D5ECF0] border border-[var(--brand-primary-border)]",
  outline:
    "bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]",
  ghost:
    "bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)] border border-transparent",
  danger:
    "bg-[var(--status-danger-solid)] text-white hover:bg-[var(--status-danger-solid-hover)] border border-transparent shadow-xs",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-11 sm:min-h-9 px-3 py-1.5 text-sm gap-1.5",
  md: "min-h-11 px-4 py-2 text-sm gap-2",
  lg: "min-h-12 px-5 py-2.5 text-base gap-2",
};

function getButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={getButtonClasses(variant, size, className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {!loading && rightIcon ? (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  },
);
Button.displayName = "Button";

export interface ButtonLinkProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={getButtonClasses(variant, size, className)} {...props}>
      {leftIcon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}
      <span>{children}</span>
      {rightIcon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      ) : null}
    </Link>
  );
}
