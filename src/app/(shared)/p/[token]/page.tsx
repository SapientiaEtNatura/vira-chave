import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SharedPortfolioView } from "@/components/portfolio/SharedPortfolioView";
import {
  DEMO_PORTFOLIO,
  DEMO_PORTFOLIO_TOKEN,
} from "@/lib/portfolio/demo-portfolio";
import { getSharedPortfolioByToken } from "@/lib/portfolio/portfolio-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfólio Compartilhado | VIRA CHAVE",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharedPortfolioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const isDemo = token === DEMO_PORTFOLIO_TOKEN;
  const portfolio = isDemo
    ? DEMO_PORTFOLIO
    : await getSharedPortfolioByToken(token);

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] px-4 py-10 text-[var(--ink-primary)]">
      <main className="mx-auto max-w-5xl space-y-6">
        {isDemo ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] px-4 py-2 text-xs font-medium text-[var(--brand-primary-deep)]">
            <span>
              Portfólio de demonstração com dados ilustrativos da plataforma
              VIRA CHAVE.
            </span>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--brand-primary)] hover:underline sm:min-h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Voltar à página inicial</span>
            </Link>
          </div>
        ) : null}

        <SharedPortfolioView
          portfolio={portfolio}
          shareToken={token}
          isDemo={isDemo}
        />
      </main>
    </div>
  );
}
