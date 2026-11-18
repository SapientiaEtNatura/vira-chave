import Link from "next/link";
import { cn } from "@/lib/cn";

export interface BrandLogoProps {
  href?: string;
  subtitle?: string;
  variant?: "default" | "dock";
  showText?: boolean;
  className?: string;
}

export function BrandLogo({
  href,
  subtitle,
  variant = "default",
  showText = true,
  className,
}: BrandLogoProps) {
  const isDock = variant === "dock";
  const iconSize = isDock ? 18 : 20;

  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center text-white",
          isDock
            ? "rounded-full border border-white/15 bg-white/12"
            : "rounded-lg bg-[var(--brand-primary)] shadow-xs",
        )}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 20V10C7 6.68629 9.68629 4 13 4C16.3137 4 19 6.68629 19 10V20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="13" cy="10.5" r="2.25" stroke="#F59E0B" strokeWidth="2" />
          <path
            d="M13 12.75V17.5M13 15.5H15.5"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText ? (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-display font-bold tracking-tight whitespace-nowrap",
              isDock
                ? "text-sm text-white"
                : "text-base text-[var(--ink-primary)]",
            )}
          >
            VIRA CHAVE
          </span>
          {subtitle ? (
            <span className="text-xs font-medium text-[var(--ink-muted)]">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Vira Chave — Início"
        title={!showText ? "Vira Chave" : undefined}
        className={cn(
          isDock
            ? "flex h-11 shrink-0 items-center rounded-full transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            : "inline-flex min-h-11 items-center rounded-lg px-1.5 py-1 transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("inline-flex items-center", className)}>{content}</div>
  );
}
