import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  FolderKanban,
  Rocket,
  ShieldCheck,
} from "lucide-react";

const stages = [
  {
    step: "01",
    title: "Descobrir",
    description:
      "Responda a um questionário rápido de interesses e veja quais macroáreas combinam mais com o seu momento.",
    icon: Compass,
  },
  {
    step: "02",
    title: "Aprender",
    description:
      "Siga trilhas organizadas com cursos gratuitos selecionados, registre seu progresso e salve suas anotações.",
    icon: BookOpen,
  },
  {
    step: "03",
    title: "Experimentar",
    description:
      "Escolha desafios práticos reais ligados às áreas que você quer explorar e tire suas ideias do papel.",
    icon: Rocket,
  },
  {
    step: "04",
    title: "Construir",
    description:
      "Reúna projetos, reflexões e evidências no seu portfólio e compartilhe um link seguro quando quiser.",
    icon: FolderKanban,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-extrabold text-white">
              VC
            </span>
            <span>VIRA CHAVE</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Para estudantes do ensino médio
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
              Descubra possibilidades. Desenvolva habilidades. Construa seu
              caminho.
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              O VIRA CHAVE é a plataforma educacional gratuita que conecta
              autoconhecimento, trilhas de aprendizagem, desafios práticos e um
              portfólio real para você mostrar o que sabe fazer.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span>Começar agora com código da turma</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="jornada-heading"
          className="border-t border-slate-200 bg-white py-14 sm:py-16"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Sua jornada em 4 etapas
              </p>
              <h2
                id="jornada-heading"
                className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl"
              >
                Do primeiro passo até o seu portfólio
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Cada etapa foi pensada para dar clareza, autonomia e prática no
                seu ritmo.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <article
                    key={stage.step}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-bold tracking-wider text-slate-400">
                          ETAPA {stage.step}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        {stage.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {stage.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 h-6 w-6 shrink-0 text-indigo-700"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-bold text-indigo-950">
                  Privacidade e controle dos seus dados
                </h2>
                <p className="mt-1 text-sm text-indigo-900">
                  Seus rascunhos são privados por padrão e você pode gerenciar
                  seus consentimentos ou excluir sua conta a qualquer momento.
                </p>
              </div>
            </div>
            <Link
              href="/privacidade"
              className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 border border-indigo-200 transition hover:bg-indigo-100"
            >
              Política de Privacidade
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>VIRA CHAVE · Plataforma educacional</p>
          <div className="flex items-center gap-5">
            <Link href="/termos" className="hover:text-slate-900 underline">
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="hover:text-slate-900 underline"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
