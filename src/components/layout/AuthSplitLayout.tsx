import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  FlaskConical,
  Hammer,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/ui";

export interface AuthSplitLayoutProps {
  headline: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "md" | "lg";
}

const AUTH_STAGES = [
  {
    step: "1",
    name: "Descobrir",
    detail: "Mapeie suas áreas de interesse",
    Icon: Compass,
  },
  {
    step: "2",
    name: "Aprender",
    detail: "Trilhas curtas e gratuitas",
    Icon: BookOpen,
  },
  {
    step: "3",
    name: "Experimentar",
    detail: "Desafios reais para praticar",
    Icon: FlaskConical,
  },
  {
    step: "4",
    name: "Construir",
    detail: "Portfólio com link sob seu controle",
    Icon: Hammer,
  },
] as const;

export function AuthSplitLayout({
  headline,
  description,
  children,
  maxWidth = "md",
}: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        aria-label="Sobre a plataforma VIRA CHAVE"
        className="relative hidden flex-col justify-between overflow-hidden bg-[var(--brand-primary-deep)] p-10 text-white lg:flex xl:p-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[var(--brand-accent)]"
        />

        <div className="relative z-10">
          <BrandLogo href="/" variant="dock" />
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-8 py-10">
          <div className="space-y-3">
            <h2 className="font-display text-3xl font-bold leading-[1.12] tracking-tight text-white xl:text-4xl">
              {headline}
            </h2>
            {description ? (
              <p className="max-w-[46ch] text-base leading-relaxed text-[var(--brand-primary-ink-on-dark)]">
                {description}
              </p>
            ) : null}
          </div>

          <ol className="grid grid-cols-2 gap-3 border-t border-white/15 pt-6">
            {AUTH_STAGES.map(({ step, name, detail, Icon }) => (
              <li
                key={step}
                className="flex items-start gap-2.5 rounded-xl border border-white/12 bg-white/5 p-3"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/12 text-[var(--brand-accent)]">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-white">
                    {name}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-[var(--brand-primary-ink-on-dark)]">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-[var(--brand-primary-ink-on-dark)]">
          <ShieldCheck
            className="h-4 w-4 shrink-0 text-[var(--brand-accent)]"
            aria-hidden="true"
          />
          <span>
            Gratuito, sem anúncios e com proteção de dados para adolescentes
            (LGPD).
          </span>
        </div>
      </aside>

      <div className="flex flex-col justify-center bg-[var(--bg-surface)] px-5 py-8 sm:px-10 lg:px-14">
        <div
          className={
            maxWidth === "lg"
              ? "mx-auto w-full max-w-lg"
              : "mx-auto w-full max-w-md"
          }
        >
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <BrandLogo href="/" />
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Início</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
