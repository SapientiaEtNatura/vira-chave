"use client";

import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandLogo, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

const SECTION_IDS = ["como-funciona", "na-pratica", "para-quem"] as const;

const PUBLIC_LINKS = [
  { href: "/#como-funciona", label: "Como funciona", sectionId: "como-funciona" },
  { href: "/#na-pratica", label: "Exemplos reais", sectionId: "na-pratica" },
  { href: "/#para-quem", label: "Para quem", sectionId: "para-quem" },
  { href: "/privacidade", label: "Privacidade", sectionId: null },
] as const;

export function PublicHeader({
  dashboardHref = null,
}: {
  dashboardHref?: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const updateScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      if (y <= 16) {
        setActiveSection(null);
      }
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        event.target instanceof Node &&
        !headerRef.current.contains(event.target)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (elements.length === 0) return;

    const visibleRatios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRatios.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }

        if (window.scrollY <= 16) {
          setActiveSection(null);
          return;
        }

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const id of SECTION_IDS) {
          const ratio = visibleRatios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId) {
          setActiveSection(bestId);
        }
      },
      {
        rootMargin: "-25% 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.6],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  function handleNavClick(
    event: MouseEvent<HTMLAnchorElement>,
    item: (typeof PUBLIC_LINKS)[number],
    closeMobile = false,
  ) {
    if (closeMobile) {
      setMobileOpen(false);
    }

    if (!item.sectionId || pathname !== "/") {
      return;
    }

    const section = document.getElementById(item.sectionId);
    if (!section) return;

    event.preventDefault();
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";

    window.history.replaceState(null, "", `/#${item.sectionId}`);
    section.scrollIntoView({ behavior, block: "start" });
  }

  function isItemActive(item: (typeof PUBLIC_LINKS)[number]): boolean {
    if (item.sectionId) {
      return pathname === "/" && activeSection === item.sectionId;
    }
    return pathname === item.href;
  }

  return (
    <header
      ref={headerRef}
      className={cn("sticky top-0 z-30 w-full", scrolled && "px-3 sm:px-4")}
    >
      <div
        className={cn(
          "mx-auto transition-[max-width,transform,border-radius,box-shadow,border-color,background-color,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          scrolled
            ? "max-w-5xl translate-y-2.5 rounded-full border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] px-4 shadow-[0_10px_28px_-8px_rgba(16,24,40,0.12)] sm:px-5"
            : "max-w-full translate-y-0 rounded-none border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-0 shadow-none",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 py-2.5 transition-[max-width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            scrolled ? "max-w-full px-1" : "max-w-6xl px-4",
          )}
        >
          <BrandLogo href="/" />

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-1.5 md:flex"
          >
            {PUBLIC_LINKS.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "location" : undefined}
                  onClick={(event) => handleNavClick(event, item)}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none",
                    active
                      ? scrolled
                        ? "bg-[var(--bg-surface)] font-semibold text-[var(--brand-primary)] shadow-2xs"
                        : "bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]"
                      : scrolled
                        ? "text-[var(--brand-primary-deep)] hover:bg-[var(--bg-surface)]/65 hover:text-[var(--ink-primary)]"
                        : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {dashboardHref ? (
              <ButtonLink href={dashboardHref} variant="primary" size="md">
                Acessar painel
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="md">
                  Entrar
                </ButtonLink>
                <ButtonLink href="/cadastro" variant="primary" size="md">
                  Criar conta
                </ButtonLink>
              </>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-surface-subtle)] md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="public-mobile-menu"
          className="absolute inset-x-4 top-full mt-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.16)] md:hidden"
        >
          <nav aria-label="Menu mobile" className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "location" : undefined}
                  onClick={(event) => handleNavClick(event, item, true)}
                  className={cn(
                    "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-3">
              {dashboardHref ? (
                <ButtonLink
                  href={dashboardHref}
                  variant="primary"
                  size="md"
                  onClick={() => setMobileOpen(false)}
                  className="w-full justify-center"
                >
                  Acessar painel
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink
                    href="/login"
                    variant="outline"
                    size="md"
                    onClick={() => setMobileOpen(false)}
                    className="w-full justify-center"
                  >
                    Entrar
                  </ButtonLink>
                  <ButtonLink
                    href="/cadastro"
                    variant="primary"
                    size="md"
                    onClick={() => setMobileOpen(false)}
                    className="w-full justify-center"
                  >
                    Criar conta
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
