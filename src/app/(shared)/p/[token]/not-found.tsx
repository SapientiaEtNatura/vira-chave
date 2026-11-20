import { ArrowLeft, ShieldAlert } from "lucide-react";
import { BrandLogo, ButtonLink, Card } from "@/components/ui";

export default function SharedPortfolioNotFoundPage() {
  return (
    <main className="bg-notebook-dots flex min-h-screen items-center justify-center px-4 py-12">
      <Card padding="lg" className="w-full max-w-lg space-y-6 text-center">
        <div className="flex justify-center">
          <BrandLogo subtitle="Portfólio Compartilhado" />
        </div>

        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)]">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Este link de portfólio não está disponível
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
            O estudante pode ter desativado o compartilhamento ou gerado um novo
            link. Peça o endereço atualizado diretamente a quem compartilhou.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink
            href="/"
            variant="primary"
            size="md"
            leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          >
            Conhecer o VIRA CHAVE
          </ButtonLink>
          <ButtonLink href="/p/exemplo" variant="outline" size="md">
            Ver portfólio de demonstração
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
