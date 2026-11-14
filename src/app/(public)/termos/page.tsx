import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-slate-700">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            VIRA CHAVE · Versão 1.0
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Termos de Uso e Compromisso Educacional
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Explicamos de forma simples como funciona a plataforma e quais são
            os combinados para estudantes e educadores.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            1. O que é o VIRA CHAVE
          </h2>
          <p className="text-sm leading-relaxed">
            O VIRA CHAVE é uma plataforma educacional gratuita para ajudar
            estudantes do ensino médio a descobrir áreas de interesse, estudar em
            trilhas organizadas, praticar em desafios reais e montar um portfólio
            com seus próprios projetos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Uso da conta e segurança
          </h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
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

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            3. Vínculo escolar e autonomia do estudante
          </h2>
          <p className="text-sm leading-relaxed">
            Ao entrar em uma turma com o código de convite, seu educador poderá
            acompanhar seu avanço nas etapas da jornada para apoiar você na
            escola. Seus rascunhos privados e seu portfólio só ficam visíveis
            fora da plataforma se você gerar um link compartilhável — e você
            pode desativar esse link quando quiser.
          </p>
        </section>

        <section
          id="sigilo-educador"
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-2"
        >
          <h2 className="text-lg font-semibold text-indigo-950">
            4. Termo de Compromisso e Sigilo do Educador
          </h2>
          <p className="text-sm leading-relaxed text-indigo-900">
            Ao se cadastrar como Educador(a) no VIRA CHAVE, você declara e se
            compromete a:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 text-indigo-900">
            <li>
              Utilizar os dados e indicadores das turmas exclusivamente para fins
              pedagógicos e de orientação educacional dentro da sua instituição.
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
        </section>

        <footer className="border-t border-slate-200 pt-4 flex flex-wrap gap-4 text-sm">
          <Link
            href="/privacidade"
            className="font-medium text-indigo-600 hover:underline"
          >
            Ler Política de Privacidade (LGPD)
          </Link>
          <Link
            href="/cadastro"
            className="font-medium text-slate-600 hover:underline"
          >
            Voltar para o cadastro
          </Link>
        </footer>
      </article>
    </main>
  );
}
