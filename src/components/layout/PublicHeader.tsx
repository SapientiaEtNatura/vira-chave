"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo, ButtonLink } from "@/components/ui";

const PUBLIC_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/privacidade", label: "Privacidade" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <BrandLogo href="/" />

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex"
        >
          {PUBLIC_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ButtonLink href="/login" variant="ghost" size="md">
            Entrar
          </ButtonLink>
          <ButtonLink href="/cadastro" variant="primary" size="md">
            Criar conta
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-menu"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-surface-subtle)] md:hidden"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="public-mobile-menu"
          className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 md:hidden"
        >
          <nav aria-label="Menu mobile" className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-3">
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
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
