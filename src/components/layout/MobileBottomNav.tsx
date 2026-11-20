"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";

export interface MobileBottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

export interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
  activeHref: string;
  className?: string;
}

export function MobileBottomNav({
  items,
  activeHref,
  className,
}: MobileBottomNavProps) {
  const { containerRef, setItemRef, indicator } =
    useSlidingIndicator(activeHref);
  const centerX = indicator.x + indicator.width / 2;

  return (
    <nav
      aria-label="Navegação móvel"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 overflow-x-clip border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(16,24,40,0.06)]",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="relative mx-auto grid max-w-lg grid-flow-col auto-cols-fr items-center px-1.5 py-1.5 sm:px-3"
      >
        <svg
          aria-hidden="true"
          width="124"
          height="32"
          viewBox="0 0 124 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute -top-[26px] left-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translate3d(${centerX - 62}px, 0, 0)`,
            opacity: indicator.ready ? 1 : 0,
          }}
        >
          <path
            d="M0 32V26C24 26 30 1 62 1C94 1 100 26 124 26V32H0Z"
            fill="var(--bg-surface)"
          />
          <path
            d="M0 26C24 26 30 1 62 1C94 1 100 26 124 26"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
        </svg>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-[18px] left-0 h-12 w-12 rounded-full bg-[var(--brand-primary)] shadow-sm transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translate3d(${centerX - 24}px, 0, 0)`,
            opacity: indicator.ready ? 1 : 0,
          }}
        />

        {items.map((item) => (
          <Link
            key={item.href}
            ref={setItemRef(item.href)}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            aria-label={item.label}
            className="relative z-10 flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-6 w-6 items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                item.active
                  ? "-translate-y-[17px] text-white"
                  : "translate-y-0 text-[var(--ink-secondary)]",
              )}
            >
              {item.icon}
            </span>
            <span
              className={cn(
                "max-w-full truncate text-[10px] leading-3 transition-colors duration-200",
                item.active
                  ? "font-semibold text-[var(--brand-primary)]"
                  : "font-medium text-[var(--ink-muted)]",
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
