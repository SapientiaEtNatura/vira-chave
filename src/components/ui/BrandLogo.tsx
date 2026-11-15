import Link from "next/link";
import { cn } from "@/lib/cn";

export interface BrandLogoProps {
  href?: string;
  subtitle?: string;
  className?: string;
}

export function BrandLogo({ href, subtitle, className }: BrandLogoProps) {
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white shadow-xs"
      >
        <svg
          width="20"
          height="20"
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
      <span className="flex flex-col leading-tight">
        <span className="font-display text-base font-bold tracking-tight text-[var(--ink-primary)]">
          VIRA CHAVE
        </span>
        {subtitle ? (
          <span className="text-xs font-medium text-[var(--ink-muted)]">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-11 items-center rounded-lg px-1.5 py-1 transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35",
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
