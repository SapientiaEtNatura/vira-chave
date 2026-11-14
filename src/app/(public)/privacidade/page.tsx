import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-slate-700">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            VIRA CHAVE · LGPD · Versão 1.0
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Transparência e cuidado especial com os dados de adolescentes, em
            conformidade com a LGPD (Lei nº 13.709/2018, incluindo o Art. 14).
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            1. Quais dados coletamos (e por quê)
          </h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>
              <strong>Cadastro:</strong> nome, e-mail, senha criptografada e
              vínculo com sua turma/escola. Usamos apenas para identificar sua
              conta e conectar você à sua turma.
            </li>
            <li>
              <strong>Jornada educacional:</strong> respostas do quiz de
              descoberta, progresso nas trilhas de estudo e projetos do seu
              portfólio.
            </li>
            <li>
              <strong>Registros de consentimento:</strong> data e versão dos
              termos que você aceitou.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Quem pode ver suas informações
          </h2>
          <p className="text-sm leading-relaxed">
            Seus dados <strong>nunca</strong> são vendidos ou compartilhados com
            anunciantes ou empresas externas.
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>
              <strong>Você:</strong> tem controle total sobre seu perfil, suas
              anotações e seus projetos.
            </li>
            <li>
              <strong>Educador da sua turma:</strong> vê apenas informações
              pedagógicas de progresso e projetos vinculados à turma para
              orientar seus estudos.
            </li>
            <li>
              <strong>Link público do portfólio:</strong> só existe se você
              decidir gerar um link compartilhável, podendo revogá-lo a qualquer
              momento.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            3. Seus direitos na LGPD
          </h2>
          <p className="text-sm leading-relaxed">
            A qualquer momento você (ou seus responsáveis legais) pode:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Consultar e corrigir seus dados cadastrais;</li>
            <li>Revogar o link de compartilhamento do seu portfólio;</li>
            <li>
              Solicitar a exclusão da sua conta diretamente nas configurações de
              privacidade, removendo seus dados pessoais e projetos.
            </li>
          </ul>
        </section>

        <footer className="border-t border-slate-200 pt-4 flex flex-wrap gap-4 text-sm">
          <Link
            href="/termos"
            className="font-medium text-indigo-600 hover:underline"
          >
            Ler Termos de Uso
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
