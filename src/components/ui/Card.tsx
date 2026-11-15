import * as React from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "interactive" | "highlight";
export type CardPadding = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs",
  interactive:
    "bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs transition-colors hover:border-[var(--border-strong)] hover:bg-[#FCFDFE]",
  highlight:
    "bg-[var(--brand-primary-soft)]/50 border border-[var(--brand-primary-border)] shadow-xs",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: "div" | "section" | "article";
}

export function Card({
  variant = "default",
  padding = "md",
  as: Component = "div",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        "rounded-xl",
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
