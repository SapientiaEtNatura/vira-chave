import { ArrowLeft, Compass } from "lucide-react";
import { BrandLogo, ButtonLink, Card } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <main className="bg-notebook-dots flex min-h-screen items-center justify-center px-4 py-12">
      <Card padding="lg" className="w-full max-w-lg space-y-6 text-center">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)] sm:text-3xl">
            Página não encontrada
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
            O endereço que você tentou abrir não existe ou foi removido. Volte
            para a página inicial ou acesse sua conta para continuar o percurso.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink
            href="/"
            variant="primary"
            size="md"
            leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          >
            Voltar ao início
          </ButtonLink>
          <ButtonLink href="/login" variant="outline" size="md">
            Entrar na plataforma
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
