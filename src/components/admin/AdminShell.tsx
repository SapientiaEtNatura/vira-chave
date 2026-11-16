"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MobileAccountMenu } from "@/components/layout/MobileAccountMenu";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { BrandLogo } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/conteudo", label: "Conteúdo", icon: BookOpen },
  { href: "/admin/instituicoes", label: "Instituições", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/auditoria", label: "Auditoria", icon: ClipboardList },
];

export interface AdminShellProps {
  userName?: string;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

function isNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getInitials(name?: string): string {
  const source = (name || "Admin").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AdminShell({
  userName,
  signOutAction,
  children,
}: AdminShellProps) {
  const pathname = usePathname() ?? "";
  const activeHref =
    ADMIN_NAV_ITEMS.find((item) => isNavItemActive(pathname, item))?.href ?? "";
  const desktopNav = useSlidingIndicator(activeHref);
  const displayName = userName?.trim() || "Admin";
  const initials = getInitials(displayName);
  const bottomNavItems = ADMIN_NAV_ITEMS.map((item) => {
    const Icon = item.icon;
    return {
      href: item.href,
      label: item.label,
      icon: <Icon className="h-5 w-5" aria-hidden="true" />,
      active: isNavItemActive(pathname, item),
    };
  });

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="shrink-0">
            <BrandLogo href="/admin" subtitle="Admin" />
          </div>

          <nav
            ref={desktopNav.containerRef}
            aria-label="Navegação administrativa"
            className="relative hidden md:flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-[var(--brand-primary)] shadow-xs transition-[transform,width,height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: desktopNav.indicator.width,
                height: desktopNav.indicator.height,
                transform: `translate3d(${desktopNav.indicator.x}px, ${desktopNav.indicator.y}px, 0)`,
                opacity: desktopNav.indicator.ready ? 1 : 0,
              }}
            />
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  ref={desktopNav.setItemRef(item.href)}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative z-10 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
                    active
                      ? "text-white"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface)]/80 hover:text-[var(--ink-primary)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-xs">
              <span className="px-1 text-[11px] font-medium text-[var(--ink-muted)]">
                Preview:
              </span>
              <Link
                href="/app"
                className="rounded-full px-2 py-0.5 font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--brand-primary)]"
              >
                Estudante
              </Link>
              <Link
                href="/educador"
                className="rounded-full px-2 py-0.5 font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--brand-primary)]"
              >
                Educador
              </Link>
            </div>

            <div
              className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-1 pl-1 pr-3"
              title={displayName}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[11px] font-semibold text-[var(--brand-primary)]">
                {initials}
              </span>
              <span className="max-w-[110px] truncate text-xs font-medium text-[var(--ink-secondary)]">
                {displayName}
              </span>
            </div>

            <form action={signOutAction} className="hidden md:block">
              <button
                type="submit"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sair</span>
              </button>
            </form>

            <MobileAccountMenu
              className="md:hidden"
              userName={displayName}
              subtitle="Admin"
              extraLinks={[
                {
                  href: "/app",
                  label: "Preview: Estudante",
                  icon: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
                },
                {
                  href: "/educador",
                  label: "Preview: Educador",
                  icon: <UserCheck className="h-4 w-4" aria-hidden="true" />,
                },
              ]}
              signOutAction={signOutAction}
            />
          </div>
        </div>
      </header>

      <MobileBottomNav
        className="md:hidden"
        items={bottomNavItems}
        activeHref={activeHref}
      />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 md:pb-8">
        <aside
          aria-label="Atalhos laterais do admin"
          className="hidden lg:flex w-14 shrink-0 flex-col items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3 sticky top-20 h-[calc(100vh-7rem)]"
        >
          <div className="flex flex-col items-center gap-2">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150",
                    active
                      ? "bg-[var(--brand-primary)] text-white shadow-xs"
                      : "text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
            <Link
              href="/app"
              title="Preview Estudante"
              aria-label="Preview Estudante"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/educador"
              title="Preview Educador"
              aria-label="Preview Educador"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
