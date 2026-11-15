import Link from "next/link";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";

const PRIVACY_SECTIONS = [
  { id: "dados-coletados", label: "1. Quais dados coletamos" },
  { id: "quem-pode-ver", label: "2. Quem pode ver suas informações" },
  { id: "direitos-lgpd", label: "3. Seus direitos na LGPD" },
];

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <div className="grid items-start gap-8 lg:grid-cols-12">
        <aside className="lg:sticky lg:top-24 lg:col-span-4">
          <Card variant="default" padding="md" className="space-y-4">
            <div className="space-y-2">
              <Badge variant="brand">LGPD · Versão 1.0</Badge>
              <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                Privacidade sem letrinha miúda
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                Explicamos de forma direta o que coletamos, quem pode ver e como
                você controla seus dados na plataforma.
              </p>
            </div>

            <nav aria-label="Seções da política" className="space-y-1 border-t border-[var(--border-subtle)] pt-3">
              {PRIVACY_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--brand-primary)]"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </Card>
        </aside>

        <div className="lg:col-span-8">
          <Card
            as="article"
            variant="default"
            padding="lg"
            className="space-y-6 text-[var(--ink-secondary)]"
          >
            <div className="space-y-3 border-b border-[var(--border-subtle)] pb-5">
              <PageHeader
                title="Política de Privacidade"
                subtitle="Transparência e cuidado especial com os dados de adolescentes, em conformidade com a LGPD (Lei nº 13.709/2018, incluindo o Art. 14)."
              />
            </div>

            <section id="dados-coletados" className="max-w-[68ch] scroll-mt-24 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
                1. Quais dados coletamos (e por quê)
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink-secondary)]">
                <li>
                  <strong className="text-[var(--ink-primary)]">Cadastro:</strong>{" "}
                  nome, e-mail, senha criptografada e vínculo com sua turma/escola.
                  Usamos apenas para identificar sua conta e conectar você à sua
                  turma.
                </li>
                <li>
                  <strong className="text-[var(--ink-primary)]">
                    Jornada educacional:
                  </strong>{" "}
                  respostas do quiz de descoberta, progresso nas trilhas de estudo e
                  projetos do seu portfólio.
                </li>
                <li>
                  <strong className="text-[var(--ink-primary)]">
                    Registros de consentimento:
                  </strong>{" "}
                  data e versão dos termos que você aceitou.
                </li>
              </ul>
            </section>

            <section id="quem-pode-ver" className="max-w-[68ch] scroll-mt-24 space-y-3">
              <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
                2. Quem pode ver suas informações
              </h2>
              <Alert
                variant="info"
                title="Sigilo entre estudante e educador"
              >
                <p className="mb-2">
                  Seus dados <strong>nunca</strong> são vendidos ou compartilhados
                  com anunciantes ou empresas externas.
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Você:</strong> tem controle total sobre seu perfil, suas
                    anotações e seus projetos.
                  </li>
                  <li>
                    <strong>Educador da sua turma:</strong> vê apenas informações
                    pedagógicas de progresso e projetos vinculados à turma para
                    orientar seus estudos, sob compromisso formal de sigilo.
                  </li>
                  <li>
                    <strong>Link público do portfólio:</strong> só existe se você
                    decidir gerar um link compartilhável, podendo revogá-lo a
                    qualquer momento.
                  </li>
                </ul>
              </Alert>
            </section>

            <section id="direitos-lgpd" className="max-w-[68ch] scroll-mt-24 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
                3. Seus direitos na LGPD
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                A qualquer momento você (ou seus responsáveis legais) pode:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink-secondary)]">
                <li>Consultar e corrigir seus dados cadastrais;</li>
                <li>Revogar o link de compartilhamento do seu portfólio;</li>
                <li>
                  Solicitar a exclusão da sua conta diretamente nas configurações de
                  privacidade, removendo seus dados pessoais e projetos.
                </li>
              </ul>
            </section>

            <footer className="flex flex-wrap gap-5 border-t border-[var(--border-subtle)] pt-4 text-sm">
              <Link
                href="/termos"
                className="inline-flex min-h-11 items-center font-medium text-[var(--brand-primary)] underline-offset-4 hover:underline"
              >
                Ler Termos de Uso
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex min-h-11 items-center font-medium text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--ink-primary)] hover:underline"
              >
                Voltar para o cadastro
              </Link>
            </footer>
          </Card>
        </div>
      </div>
    </div>
  );
}
