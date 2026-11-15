"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  Compass,
  FolderKanban,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Rocket,
  ShieldCheck,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/ui";
import { cn } from "@/lib/cn";

export type NavIconKey =
  | "home"
  | "compass"
  | "book"
  | "rocket"
  | "folder"
  | "user"
  | "users"
  | "building"
  | "shield"
  | "graduation";

const ICON_MAP: Record<NavIconKey, LucideIcon> = {
  home: Home,
  compass: Compass,
  book: BookOpen,
  rocket: Rocket,
  folder: FolderKanban,
  user: UserCircle,
  users: Users,
  building: Building2,
  shield: ShieldCheck,
  graduation: GraduationCap,
};

export interface AppNavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  exact?: boolean;
}

export interface AppNavProps {
  homeHref: string;
  subtitle: string;
  items: AppNavItem[];
  userName?: string;
  signOutAction: () => Promise<void>;
}

function isItemActive(pathname: string, item: AppNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getInitials(name?: string, fallback?: string): string {
  const source = (name || fallback || "VC").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppNav({
  homeHref,
  subtitle,
  items,
  userName,
  signOutAction,
}: AppNavProps) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = getInitials(userName, subtitle);

  const navContent = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-5">
        <div className="px-1">
          <BrandLogo href={homeHref} />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] font-mono text-xs font-bold text-[var(--brand-primary)]"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink-primary)]">
              {userName || subtitle}
            </p>
            <p className="truncate text-xs text-[var(--ink-muted)]">{subtitle}</p>
          </div>
        </div>

        <nav aria-label="Navegação principal" className="space-y-1">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = isItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <form action={signOutAction} className="border-t border-[var(--border-subtle)] pt-4">
        <button
          type="submit"
          className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sair da conta</span>
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Sidebar fixa no desktop */}
      <aside className="hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
        {navContent()}
      </aside>

      {/* Topbar móvel */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <BrandLogo href={homeHref} subtitle={subtitle} />

        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="app-mobile-drawer"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Drawer móvel */}
      {mobileOpen ? (
        <div
          id="app-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className="fixed inset-0 z-40 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl">
            <div className="flex items-center justify-end px-4 pt-3">
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navContent(() => setMobileOpen(false))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
