import Link from "next/link";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <Card
        as="article"
        variant="default"
        padding="lg"
        className="space-y-6 text-[var(--ink-secondary)]"
      >
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-5">
          <Badge variant="neutral">Versão 1.0</Badge>
          <PageHeader
            title="Termos de Uso e Compromisso Educacional"
            subtitle="Explicamos de forma simples como funciona a plataforma e quais são os combinados para estudantes e educadores."
          />
        </div>

        <section className="max-w-[68ch] space-y-2">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            1. O que é o VIRA CHAVE
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
            O VIRA CHAVE é uma plataforma educacional gratuita para ajudar
            estudantes do ensino médio a descobrir áreas de interesse, estudar em
            trilhas organizadas, praticar em desafios reais e montar um portfólio
            com seus próprios projetos.
          </p>
        </section>

        <section className="max-w-[68ch] space-y-2">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            2. Uso da conta e segurança
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink-secondary)]">
            <li>
              Sua conta é pessoal: não compartilhe sua senha com outras pessoas.
            </li>
            <li>
              Estudantes ingressam utilizando o código de turma fornecido pela
              escola ou educador responsável.
            </li>
            <li>
              Você é responsável pelos textos, links e arquivos que enviar ao seu
              portfólio, devendo respeitar direitos autorais e evitar conteúdos
              ofensivos ou ilegais.
            </li>
          </ul>
        </section>

        <section className="max-w-[68ch] space-y-2">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            3. Vínculo escolar e autonomia do estudante
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
            Ao entrar em uma turma com o código de convite, seu educador poderá
            acompanhar seu avanço nas etapas da jornada para apoiar você na
            escola. Seus rascunhos privados e seu portfólio só ficam visíveis
            fora da plataforma se você gerar um link compartilhável — e você
            pode desativar esse link quando quiser.
          </p>
        </section>

        <section id="sigilo-educador" className="max-w-[68ch]">
          <Alert
            variant="info"
            title="4. Termo de Compromisso e Sigilo do Educador"
          >
            <p className="mb-2">
              Ao se cadastrar como Educador(a) no VIRA CHAVE, você declara e se
              compromete a:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Utilizar os dados e indicadores das turmas exclusivamente para
                fins pedagógicos e de orientação educacional dentro da sua
                instituição.
              </li>
              <li>
                Manter sigilo absoluto sobre informações individuais de
                estudantes, não divulgando prints, planilhas ou perfis em redes
                sociais, grupos externos ou para fins comerciais.
              </li>
              <li>
                Respeitar a Lei Geral de Proteção de Dados (LGPD — Lei nº
                13.709/2018) e o Estatuto da Criança e do Adolescente (ECA).
              </li>
            </ul>
          </Alert>
        </section>

        <footer className="flex flex-wrap gap-5 border-t border-[var(--border-subtle)] pt-4 text-sm">
          <Link
            href="/privacidade"
            className="inline-flex min-h-11 items-center font-medium text-[var(--brand-primary)] underline-offset-4 hover:underline"
          >
            Ler Política de Privacidade (LGPD)
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
  );
}
