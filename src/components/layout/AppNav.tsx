"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardList,
  Compass,
  EllipsisVertical,
  FolderKanban,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Pin,
  PinOff,
  Rocket,
  Shield,
  ShieldCheck,
  UserCircle,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import {
  getInitials,
  MobileAccountMenu,
  type MobileAccountMenuLink,
} from "./MobileAccountMenu";
import { MobileBottomNav } from "./MobileBottomNav";
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
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const dockNavRef = useRef<HTMLElement | null>(null);
  const isExpanded = pinned || hovered;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (variant !== "dock") return;
    try {
      const saved = window.localStorage.getItem("virachave:dock-pinned");
      if (saved === "true") {
        setPinned(true);
      }
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [variant]);

  function handlePinnedChange(next: boolean) {
    setPinned(next);
    try {
      window.localStorage.setItem("virachave:dock-pinned", String(next));
    } catch {
      // Ignore storage failures
    }
  }

  useEffect(() => {
    if (variant !== "dock") return;
    const el = dockNavRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    };

    checkOverflow();
    el.addEventListener("scroll", checkOverflow, { passive: true });
    window.addEventListener("resize", checkOverflow);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [variant, isExpanded, items.length]);
  const initials = getInitials(userName, subtitle);
  const hasPreviewBanner = Boolean(previewMode);

  const bottomNavSource =
    homeHref === "/app"
      ? items.filter((item) => item.href !== "/app/conta").slice(0, 5)
      : items.slice(0, 5);
  const bottomNavItems = bottomNavSource.map((item) => {
    const Icon = ICON_MAP[item.icon];
    return {
      href: item.href,
      label: item.label,
      icon: <Icon className="h-5 w-5" aria-hidden="true" />,
      active: isItemActive(pathname, item),
    };
  });
  const bottomActiveHref =
    bottomNavItems.find((item) => item.active)?.href ?? "";

  const accountMenuLinks: MobileAccountMenuLink[] = [];
  if (homeHref === "/app") {
    accountMenuLinks.push({
      href: "/app/conta",
      label: "Minha conta",
      icon: <UserCircle className="h-4 w-4" aria-hidden="true" />,
    });
  }
  if (isAdmin) {
    accountMenuLinks.push({
      href: "/admin",
      label: "Admin",
      icon: <Shield className="h-4 w-4" aria-hidden="true" />,
    });
  }

  const renderAdminControls = () => {
    if (!isAdmin) return null;

    if (previewMode === null) {
      return (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 px-1">
          <Link
            href="/app"
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
          >
            Preview: Estudante
          </Link>
          <Link
            href="/educador"
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
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--brand-accent)] bg-[var(--brand-accent-soft)]/50 px-3 py-2 text-xs font-semibold text-[var(--brand-accent-ink)] transition-colors duration-150 hover:bg-[var(--brand-accent-soft)]"
        >
          <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Admin</span>
        </Link>
      </div>
    );
  };

  const navContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
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
            <p className="truncate text-xs text-[var(--ink-muted)]">
              {subtitle}
            </p>
          </div>
        </div>

        <nav
          ref={desktopNav.containerRef}
          aria-label="Navegação principal"
          className="relative min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
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
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = isItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                ref={desktopNav.setItemRef(item.href)}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative z-10 flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
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
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-4">
        {renderAdminControls()}
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
            onMouseLeave={() => {
              if (!menuOpen && !pinned) {
                setHovered(false);
              }
            }}
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
                : "w-[68px] rounded-[34px]",
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden p-2.5">
              <BrandLogo
                href={homeHref}
                variant="dock"
                showText={isExpanded}
                className={
                  isExpanded
                    ? "w-full gap-2.5 px-1.5"
                    : "mx-auto w-11 justify-center"
                }
              />

              <div className="relative min-h-0 flex-1">
                <nav
                  ref={(el) => {
                    dockNavRef.current = el;
                    desktopNav.containerRef(el);
                  }}
                  aria-label="Navegação principal"
                  className={cn(
                    "relative flex h-full flex-col gap-1 overflow-y-auto overscroll-contain px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
                          "relative z-10 flex h-11 shrink-0 items-center rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
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
                          <span className="whitespace-nowrap">
                            {item.label}
                          </span>
                        ) : (
                          <span className="sr-only">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
                {canScrollDown ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[var(--brand-primary)] to-transparent"
                  />
                ) : null}
              </div>
            </div>

            <div className="mb-1.5 px-1">
              <DropdownMenu
                open={menuOpen}
                onOpenChange={(open) => {
                  setMenuOpen(open);
                  if (!open && !pinned) {
                    setHovered(false);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Opções da conta"
                    className={cn(
                      "flex w-full cursor-pointer items-center rounded-full py-2 transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                      isExpanded
                        ? "justify-between gap-2.5 px-2.5"
                        : " justify-center px-1",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      {isExpanded ? (
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-xs font-semibold text-white">
                            {userName || subtitle}
                          </span>
                          <span className="block truncate text-[11px] text-white/75">
                            {subtitle}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    {isExpanded ? (
                      <EllipsisVertical
                        size={18}
                        className="shrink-0 text-white/80"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Opções</DropdownMenuLabel>

                    {homeHref === "/app" ? (
                      <DropdownMenuItem asChild>
                        <Link href="/app/conta">
                          <UserRound />
                          Minha conta
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuCheckboxItem
                      checked={pinned}
                      onCheckedChange={(checked) =>
                        handlePinnedChange(Boolean(checked))
                      }
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
                      {pinned ? "Desafixar menu" : "Fixar menu"}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" aria-label="Ir para o painel Admin">
                        <Shield />
                        <span>Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={async () => {
                        await signOutAction();
                      }}
                    >
                      <LogOut />
                      Sair da conta
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <BrandLogo href={homeHref} />

        <MobileAccountMenu
          userName={userName}
          subtitle={subtitle}
          extraLinks={accountMenuLinks}
          signOutAction={signOutAction}
        />
      </header>

      {bottomNavItems.length > 1 ? (
        <MobileBottomNav
          className="lg:hidden"
          items={bottomNavItems}
          activeHref={bottomActiveHref}
        />
      ) : null}
    </>
  );
}
