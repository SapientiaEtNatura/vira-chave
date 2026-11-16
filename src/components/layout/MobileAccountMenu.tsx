"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MobileAccountMenuLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface MobileAccountMenuProps {
  userName?: string;
  subtitle: string;
  extraLinks?: MobileAccountMenuLink[];
  signOutAction: () => Promise<void>;
  className?: string;
}

function getInitials(name?: string, fallback?: string): string {
  const source = (name || fallback || "VC").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function MobileAccountMenu({
  userName,
  subtitle,
  extraLinks = [],
  signOutAction,
  className,
}: MobileAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const displayName = userName?.trim() || subtitle;
  const initials = getInitials(userName, subtitle);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Menu da conta de ${displayName}`}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 w-11 min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] font-mono text-xs font-bold text-[var(--brand-primary)] transition-colors duration-150 hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
      >
        {initials}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Opções da conta"
          className="absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-xl"
        >
          <div className="mb-1.5 border-b border-[var(--border-subtle)] px-3 py-2">
            <p className="truncate text-sm font-semibold text-[var(--ink-primary)]">
              {displayName}
            </p>
            <p className="truncate text-xs text-[var(--ink-muted)]">
              {subtitle}
            </p>
          </div>

          {extraLinks.length > 0 ? (
            <div className="mb-1.5 space-y-0.5 border-b border-[var(--border-subtle)] pb-1.5">
              {extraLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
                >
                  {link.icon ? (
                    <span className="shrink-0 text-[var(--ink-muted)]" aria-hidden="true">
                      {link.icon}
                    </span>
                  ) : null}
                  <span className="truncate">{link.label}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Sair da conta</span>
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
