"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] p-6 text-[var(--ink-primary)] antialiased">
        <main className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center shadow-sm">
          <h1 className="font-display text-xl font-bold text-[var(--ink-primary)]">
            Não foi possível exibir esta página
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Ocorreu um erro inesperado ao processar sua solicitação. Tente
            novamente em instantes.
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-[var(--ink-muted)]">
              Referência: {error.digest}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
            >
              Voltar ao início
            </Link>
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)]"
            >
              Tentar novamente
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
