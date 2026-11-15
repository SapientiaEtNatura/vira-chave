import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export interface AuthSplitLayoutProps {
  badge?: string;
  headline: string;
  accentLine?: string;
  description?: string;
  quote?: {
    text: string;
    author: string;
    initials?: string;
  };
  children: ReactNode;
  maxWidth?: "md" | "lg";
}

/**
 * Layout split-screen em tela cheia (50/50 no desktop) idêntico ao protótipo visual.
 */
export function AuthSplitLayout({
  badge = "PARA CADA POSSIBILIDADE, UM PRIMEIRO PASSO",
  headline = "O futuro não é algo que você espera.",
  accentLine = "É algo que você constrói.",
  quote = {
    text: "“Descobri que tecnologia também era para mim. Hoje já tenho três projetos no meu portfólio.”",
    author: "Estudante do Ensino Médio",
    initials: "VC",
  },
  children,
  maxWidth = "md",
}: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        aria-label="Apresentação da plataforma"
        className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--brand-primary-deep)] to-[var(--brand-primary)] p-10 text-white lg:flex xl:p-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full border border-white/10"
        />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
            VC
          </span>
          <span>
            VIRA <span className="font-semibold text-[var(--brand-primary-ink-on-dark)]">CHAVE</span>
          </span>
        </Link>

        <div className="relative z-10 my-auto max-w-lg space-y-6 py-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[var(--brand-primary-ink-on-dark)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </span>

          <h2 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-white xl:text-[42px]">
            {headline}{" "}
            <span className="block text-[var(--brand-primary-ink-on-dark)]">
              {accentLine}
            </span>
          </h2>

          <blockquote className="border-l-2 border-[var(--brand-accent)] pl-4">
            <p className="text-sm leading-relaxed text-white/90">
              {quote.text}
            </p>
            <footer className="mt-3 flex items-center gap-2.5 text-xs font-semibold text-white">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 font-mono text-xs">
                {quote.initials ?? "VC"}
              </span>
              <span>{quote.author}</span>
            </footer>
          </blockquote>
        </div>

        <p className="relative z-10 text-xs text-[var(--brand-primary-ink-on-dark)]">
          Gratuito. Seguro. Feito com você.
        </p>
      </aside>

      <div className="flex flex-col justify-center bg-[var(--bg-surface)] px-5 py-8 sm:px-10 lg:px-14">
        <div
          className={
            maxWidth === "lg"
              ? "mx-auto w-full max-w-lg"
              : "mx-auto w-full max-w-md"
          }
        >
          <div className="mb-6 lg:hidden">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Voltar para início</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
