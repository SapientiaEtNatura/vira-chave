"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardList,
  Compass,
  FolderKanban,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Pin,
  PinOff,
  Rocket,
  Shield,
  ShieldCheck,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import { PreviewBanner, type PreviewMode } from "./PreviewBanner";

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
  | "graduation"
  | "overview"
  | "content"
  | "institutions"
  | "audit";

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
  overview: LayoutDashboard,
  content: BookOpen,
  institutions: Building2,
  audit: ClipboardList,
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
  isAdmin?: boolean;
  previewMode?: PreviewMode | null;
  variant?: "sidebar" | "dock";
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
  isAdmin = false,
  previewMode = null,
  variant = "sidebar",
  signOutAction,
}: AppNavProps) {
  const pathname = usePathname() ?? "";
  const activeHref =
    items.find((item) => isItemActive(pathname, item))?.href ?? "";
  const desktopNav = useSlidingIndicator(activeHref);
  const mobileNav = useSlidingIndicator(activeHref);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isExpanded = pinned || hovered;
  const initials = getInitials(userName, subtitle);
  const hasPreviewBanner = Boolean(previewMode);

  const renderAdminControls = (onNavigate?: () => void) => {
    if (!isAdmin) return null;

    if (previewMode === null) {
      return (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 px-1">
          <Link
            href="/app"
            onClick={onNavigate}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
          >
            Preview: Estudante
          </Link>
          <Link
            href="/educador"
            onClick={onNavigate}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
          >
            Educador
          </Link>
        </div>
      );
    }

    return (
      <div className="mb-3 px-1">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--brand-accent)] bg-[var(--brand-accent-soft)]/50 px-3 py-2 text-xs font-semibold text-[var(--brand-accent-ink)] transition-colors duration-150 hover:bg-[var(--brand-accent-soft)]"
        >
          <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Admin</span>
        </Link>
      </div>
    );
  };

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

        <nav
          ref={onNavigate ? undefined : desktopNav.containerRef}
          aria-label="Navegação principal"
          className="relative space-y-1"
        >
          {!onNavigate ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-0 rounded-xl bg-[var(--brand-primary-soft)] transition-[transform,width,height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: desktopNav.indicator.width,
                height: desktopNav.indicator.height,
                transform: `translate3d(${desktopNav.indicator.x}px, ${desktopNav.indicator.y}px, 0)`,
                opacity: desktopNav.indicator.ready ? 1 : 0,
              }}
            />
          ) : null}
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = isItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                ref={onNavigate ? undefined : desktopNav.setItemRef(item.href)}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative z-10 flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                  active
                    ? onNavigate
                      ? "bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]"
                      : "font-semibold text-[var(--brand-primary)]"
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

      <div className="border-t border-[var(--border-subtle)] pt-4">
        {renderAdminControls(onNavigate)}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--ink-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Sair da conta</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {previewMode ? (
        <PreviewBanner
          mode={previewMode}
          className="lg:fixed lg:inset-x-0 lg:top-0 lg:z-40"
        />
      ) : null}

      {variant === "dock" ? (
        <>
          {/* Coluna reservada para o conteúdo não pular no hover */}
          <div
            aria-hidden="true"
            className={cn(
              "hidden shrink-0 transition-[width] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
              pinned ? "w-64" : "w-24",
            )}
          />

          {/* Dock retrátil flutuante em Petróleo Profundo no desktop */}
          <aside
            aria-label="Dock de navegação"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setHovered(false);
              }
            }}
            className={cn(
              "fixed left-4 bottom-6 z-30 hidden flex-col justify-between overflow-hidden border border-white/15 bg-[var(--brand-primary)] text-white shadow-lg transition-[width,border-radius] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
              hasPreviewBanner ? "top-14" : "top-6",
              isExpanded
                ? "w-[228px] rounded-[28px]"
                : "w-[64px] rounded-[32px]",
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-2.5">
              <Link
                href={homeHref}
                aria-label="Vira Chave — Início"
                title={!isExpanded ? "Vira Chave" : undefined}
                className={cn(
                  "flex h-11 shrink-0 items-center rounded-full transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  isExpanded
                    ? "w-full gap-2.5 px-1.5"
                    : "mx-auto w-11 justify-center",
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/12 text-white"
                >
                  <svg
                    width="18"
                    height="18"
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
                    <circle
                      cx="13"
                      cy="10.5"
                      r="2.25"
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />
                    <path
                      d="M13 12.75V17.5M13 15.5H15.5"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {isExpanded ? (
                  <span className="font-display text-sm font-bold tracking-tight whitespace-nowrap text-white">
                    VIRA CHAVE
                  </span>
                ) : null}
              </Link>

              {isExpanded ? (
                <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/10 px-2.5 py-2">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 font-mono text-xs font-bold text-white"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {userName || subtitle}
                    </p>
                    <p className="truncate text-[11px] text-white/75">
                      {subtitle}
                    </p>
                  </div>
                </div>
              ) : null}

              <nav
                ref={desktopNav.containerRef}
                aria-label="Navegação principal"
                className={cn(
                  "relative flex flex-col gap-1",
                  !isExpanded && "items-center",
                )}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-white shadow-xs transition-[transform,width,height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    width: desktopNav.indicator.width,
                    height: desktopNav.indicator.height,
                    transform: `translate3d(${desktopNav.indicator.x}px, ${desktopNav.indicator.y}px, 0)`,
                    opacity: desktopNav.indicator.ready ? 1 : 0,
                  }}
                />
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isItemActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      ref={desktopNav.setItemRef(item.href)}
                      href={item.href}
                      title={!isExpanded ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative z-10 flex h-11 items-center rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                        isExpanded
                          ? "w-full gap-3 px-3.5"
                          : "w-11 justify-center",
                        active
                          ? "font-semibold text-[var(--brand-primary)]"
                          : "text-white/80 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon
                        className="h-[18px] w-[18px] shrink-0"
                        aria-hidden="true"
                      />
                      {isExpanded ? (
                        <span className="whitespace-nowrap">{item.label}</span>
                      ) : (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex shrink-0 flex-col gap-1 border-t border-white/15 p-2.5">
              <button
                type="button"
                aria-pressed={pinned}
                aria-label={
                  pinned ? "Desafixar barra lateral" : "Fixar barra lateral"
                }
                title={
                  pinned ? "Desafixar barra lateral" : "Fixar barra lateral"
                }
                onClick={() => setPinned((prev) => !prev)}
                className={cn(
                  "flex h-11 cursor-pointer items-center rounded-full text-sm font-medium text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  isExpanded
                    ? "w-full gap-3 px-3.5"
                    : "mx-auto w-11 justify-center",
                )}
              >
                {pinned ? (
                  <PinOff
                    className="h-[18px] w-[18px] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Pin
                    className="h-[18px] w-[18px] shrink-0"
                    aria-hidden="true"
                  />
                )}
                {isExpanded ? (
                  <span className="whitespace-nowrap">
                    {pinned ? "Desafixar menu" : "Fixar menu"}
                  </span>
                ) : null}
              </button>

              {isAdmin ? (
                <Link
                  href="/admin"
                  title={!isExpanded ? "Admin" : undefined}
                  aria-label="Admin"
                  className={cn(
                    "flex h-11 items-center rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/20 text-sm font-semibold text-[#FDE68A] transition-colors duration-150 hover:bg-[var(--brand-accent)]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    isExpanded
                      ? "w-full gap-3 px-3.5"
                      : "mx-auto w-11 justify-center",
                  )}
                >
                  <Shield
                    className="h-[18px] w-[18px] shrink-0"
                    aria-hidden="true"
                  />
                  {isExpanded ? (
                    <span className="whitespace-nowrap">Admin</span>
                  ) : null}
                </Link>
              ) : null}

              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  title={!isExpanded ? "Sair da conta" : undefined}
                  aria-label="Sair da conta"
                  className={cn(
                    "flex h-11 cursor-pointer items-center rounded-full text-sm font-medium text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    isExpanded
                      ? "w-full gap-3 px-3.5"
                      : "mx-auto w-11 justify-center",
                  )}
                >
                  <LogOut
                    className="h-[18px] w-[18px] shrink-0"
                    aria-hidden="true"
                  />
                  {isExpanded ? (
                    <span className="whitespace-nowrap">Sair da conta</span>
                  ) : null}
                </button>
              </form>
            </div>
          </aside>
        </>
      ) : (
        /* Sidebar fixa no desktop */
        <aside
          className={cn(
            "hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:sticky lg:flex lg:w-64 lg:shrink-0 lg:flex-col",
            hasPreviewBanner
              ? "lg:top-9 lg:h-[calc(100vh-2.25rem)]"
              : "lg:top-0 lg:h-screen",
          )}
        >
          {navContent()}
        </aside>
      )}

      {/* Topbar móvel */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <BrandLogo href={homeHref} subtitle={subtitle} />

        <div className="flex items-center gap-2">
          {isAdmin && previewMode !== null ? (
            <Link
              href="/admin"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--brand-accent)] bg-[var(--brand-accent-soft)]/50 px-2.5 py-1.5 text-xs font-semibold text-[var(--brand-accent-ink)] transition-colors duration-150 hover:bg-[var(--brand-accent-soft)]"
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          ) : null}

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="app-mobile-drawer"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-primary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)]"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Pill-tabs horizontais roláveis no mobile (< md) */}
      <nav
        ref={mobileNav.containerRef}
        aria-label="Navegação rápida"
        className="relative flex items-center gap-1.5 overflow-x-auto whitespace-nowrap border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 md:hidden"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-[var(--brand-primary-soft)] transition-[transform,width,height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: mobileNav.indicator.width,
            height: mobileNav.indicator.height,
            transform: `translate3d(${mobileNav.indicator.x}px, ${mobileNav.indicator.y}px, 0)`,
            opacity: mobileNav.indicator.ready ? 1 : 0,
          }}
        />
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const active = isItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              ref={mobileNav.setItemRef(item.href)}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                active
                  ? "font-semibold text-[var(--brand-primary)]"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

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
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
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
