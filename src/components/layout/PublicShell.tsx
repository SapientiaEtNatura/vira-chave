"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui";
import { PublicHeader } from "./PublicHeader";

const AUTH_ROUTES = ["/login", "/cadastro", "/recuperar-senha"];

export function PublicShell({
  children,
  dashboardHref = null,
}: {
  children: ReactNode;
  dashboardHref?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  useEffect(() => {
    if (!isAuthRoute || !dashboardHref) return;
    if (
      pathname.startsWith("/recuperar-senha") &&
      new URLSearchParams(window.location.search).has("token")
    ) {
      return;
    }
    router.replace(dashboardHref);
  }, [isAuthRoute, dashboardHref, pathname, router]);

  if (isAuthRoute) {
    if (dashboardHref && !pathname.startsWith("/recuperar-senha")) {
      return null;
    }
    return (
      <div className="min-h-screen bg-[var(--bg-surface)] text-[var(--ink-primary)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--brand-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-md"
        >
          Pular para o conteúdo principal
        </a>
        <main id="main-content">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--brand-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-md"
      >
        Pular para o conteúdo principal
      </a>

      <PublicHeader dashboardHref={dashboardHref} />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <BrandLogo href="/" />
            <span>Do Ensino Médio ao primeiro portfólio prático.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/termos"
              className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-[var(--ink-primary)]"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-[var(--ink-primary)]"
            >
              Política de Privacidade
            </Link>
            <span>© 2026 VIRA CHAVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
