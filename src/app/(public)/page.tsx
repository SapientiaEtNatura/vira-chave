import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  ExternalLink,
  FileText,
  FlaskConical,
  FolderKanban,
  Hammer,
  ShieldCheck,
} from "lucide-react";
import {
  AffinityPreviewCard,
  HeroJourneyCard,
  type HeroJourneyStage,
  SplitTextReveal,
  StaggerGroup,
} from "@/components/motion";
import {
  Badge,
  ButtonLink,
  Card,
  type StageKey,
} from "@/components/ui";

const stages: Array<{
  key: StageKey;
  number: string;
  title: string;
  description: string;
  outcome: string;
  Icon: typeof Compass;
  barClass: string;
  iconClasses: string;
  hoverClasses: string;
  previewBadge?: string;
  previewDone?: boolean;
  previewLocked?: boolean;
}> = [
  {
    key: "DESCOBRIR",
    number: "1",
    title: "Descobrir",
    description:
      "Responda ao questionário inicial e veja quais áreas despertam seu interesse.",
    outcome: "Você sai com: mapa de afinidades",
    Icon: Compass,
    barClass: "bg-[var(--stage-discover-ink)]",
    iconClasses:
      "border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[var(--stage-discover-bg)]/65 hover:border-[var(--stage-discover-border)]",
    previewDone: true,
  },
  {
    key: "APRENDER",
    number: "2",
    title: "Aprender",
    description:
      "Estude em trilhas curtas e gratuitas ligadas às suas áreas de afinidade.",
    outcome: "Você sai com: trilhas concluídas",
    Icon: BookOpen,
    barClass: "bg-[var(--stage-learn-ink)]",
    iconClasses:
      "border-[var(--stage-learn-border)] bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[var(--stage-learn-bg)]/65 hover:border-[var(--stage-learn-border)]",
    previewDone: true,
  },
  {
    key: "EXPERIMENTAR",
    number: "3",
    title: "Experimentar",
    description:
      "Resolva desafios práticos inspirados em problemas reais do dia a dia.",
    outcome: "Você sai com: entregas práticas",
    Icon: FlaskConical,
    barClass: "bg-[var(--stage-experiment-ink)]",
    iconClasses:
      "border-[var(--stage-experiment-border)] bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[var(--stage-experiment-bg)]/65 hover:border-[var(--stage-experiment-border)]",
    previewBadge: "Em andamento",
  },
  {
    key: "CONSTRUIR",
    number: "4",
    title: "Construir",
    description:
      "Reúna seus projetos e reflexões em um portfólio com link compartilhável.",
    outcome: "Você sai com: portfólio próprio",
    Icon: Hammer,
    barClass: "bg-[var(--stage-build-ink)]",
    iconClasses:
      "border-[var(--stage-build-border)] bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[var(--stage-build-bg)]/65 hover:border-[var(--stage-build-border)]",
    previewLocked: true,
  },
];

const heroStages: HeroJourneyStage[] = stages.map(
  ({
    key,
    title,
    iconClasses,
    previewBadge,
    previewDone,
    previewLocked,
  }) => ({
    key,
    title,
    iconClasses,
    stepOffset: "",
    previewBadge,
    previewDone,
    previewLocked,
  }),
);

export default function LandingPage() {
  return (
    <>
      <section className="bg-notebook-dots border-b border-[var(--border-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="inline-block rounded-md bg-[var(--brand-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-accent-ink)]">
                Para estudantes do Ensino Médio
              </p>

              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-[var(--ink-primary)] sm:text-5xl sm:leading-[1.1]">
                Teste caminhos antes de escolher uma profissão.
              </h1>

              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[var(--ink-secondary)] sm:text-lg">
                Responda ao mapa de afinidades, faça trilhas curtas gratuitas,
                resolva desafios reais e guarde o que produziu em um portfólio
                seu.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink
                  href="/cadastro"
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  Começar gratuitamente
                </ButtonLink>
                <ButtonLink
                  href="#como-funciona"
                  variant="outline"
                  size="lg"
                >
                  Ver as 4 etapas
                </ButtonLink>
              </div>

              <p className="mt-5 text-xs font-medium text-[var(--ink-muted)]">
                100% gratuito para estudantes e escolas públicas. Sem anúncios.
              </p>
            </div>

            <div className="lg:col-span-5">
              <HeroJourneyCard stages={heroStages} />
            </div>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        aria-labelledby="jornada-heading"
        className="bg-[var(--bg-surface)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl space-y-2.5">
            <SplitTextReveal
              id="jornada-heading"
              text="Quatro passos no seu ritmo"
              className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
            <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Você não precisa chegar com tudo decidido. Comece pelo que desperta
              curiosidade e avance conforme testa cada área.
            </p>
          </div>

          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage) => {
              const { Icon } = stage;

              return (
                <div key={stage.key} data-motion-item className="flex">
                  <article
                    className={`flex w-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-all duration-300 ease-out ${stage.hoverClasses}`}
                  >
                    <div>
                      <div className={`mb-5 h-1 w-12 rounded-full ${stage.barClass}`} />

                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stage.iconClasses}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-display text-2xl font-bold text-[var(--border-strong)]">
                          {stage.number}
                        </span>
                      </div>

                      <h3 className="mt-5 font-display text-lg font-bold text-[var(--ink-primary)]">
                        {stage.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                        {stage.description}
                      </p>
                    </div>

                    <p className="mt-5 border-t border-[var(--border-subtle)] pt-3 text-xs font-medium text-[var(--ink-muted)]">
                      {stage.outcome}
                    </p>
                  </article>
                </div>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <section
        id="na-pratica"
        aria-labelledby="na-pratica-heading"
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl space-y-2.5">
            <SplitTextReveal
              id="na-pratica-heading"
              text="O que você constrói aqui dentro"
              className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
            <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Em vez de só ler sobre carreiras, você visualiza seus interesses e
              monta um portfólio com entregas reais.
            </p>
          </div>

          <StaggerGroup className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start">
            <div
              data-motion-item
              className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 lg:col-span-6"
            >
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--ink-primary)]">
                  Mapa de afinidades
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Suas respostas no Descobrir geram um painel visual das áreas que
                  mais combinam com você.
                </p>
              </div>

              <AffinityPreviewCard />
            </div>

            <div data-motion-item className="space-y-4 lg:col-span-6">
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--ink-primary)]">
                  Portfólio público do estudante
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Cada desafio concluído ou projeto pessoal vira um registro
                  organizado para compartilhar quando quiser.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--ink-muted)]">
                  Exemplo de projeto publicado
                </p>
                <Card
                  as="article"
                  padding="sm"
                  className="pointer-events-none grid select-none overflow-hidden p-0 sm:grid-cols-12 sm:p-0"
                >
                  <div className="relative flex min-h-32 flex-col items-center justify-center bg-[var(--stage-build-bg)] p-5 text-[var(--stage-build-ink)] sm:col-span-4">
                    <span className="absolute left-4 top-3.5 font-mono text-xs font-semibold tracking-wider opacity-80">
                      PROJETO 01
                    </span>
                    <FolderKanban className="h-8 w-8" aria-hidden="true" />
                  </div>

                  <div className="flex flex-col justify-between p-5 sm:col-span-8">
                    <div>
                      <div className="mb-2">
                        <Badge variant="brand">
                          Desafio: Feira de Profissões
                        </Badge>
                      </div>

                      <h4 className="font-display text-base font-bold text-[var(--ink-primary)]">
                        Guia digital para feira de profissões da escola
                      </h4>

                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-secondary)]">
                        Mapeamento de áreas profissionais com entrevistas e
                        roteiro interativo para estudantes do 1º ano.
                      </p>

                      <p className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
                        “Organizar o guia me ajudou a comparar carreiras que eu
                        nem conhecia e apresentar ideias com clareza.”
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--ink-muted)]">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Link externo</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ink-muted)]">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>guia-profissoes.pdf (1.2 MB)</span>
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </StaggerGroup>
        </div>
      </section>

      <section
        id="para-quem"
        aria-labelledby="para-quem-heading"
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl space-y-2.5">
            <SplitTextReveal
              id="para-quem-heading"
              text="Para quem estuda e para quem acompanha"
              className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
          </div>

          <StaggerGroup className="mt-10 grid gap-8 md:grid-cols-12">
            <div data-motion-item className="flex flex-col justify-between gap-6 py-2 md:col-span-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                  Estudantes
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]" aria-hidden="true" />
                    <span>Explore áreas profissionais sem pressão de acertar de primeira.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]" aria-hidden="true" />
                    <span>Faça trilhas curtas gratuitas e desafios práticos no seu tempo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]" aria-hidden="true" />
                    <span>Escolha quais projetos ficam visíveis no seu link de portfólio.</span>
                  </li>
                </ul>
              </div>

              <div>
                <ButtonLink
                  href="/cadastro"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  Criar conta de estudante
                </ButtonLink>
              </div>
            </div>

            <div
              data-motion-item
              className="flex flex-col justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] border-l-4 border-l-[var(--brand-primary)] bg-[var(--bg-surface-subtle)] p-6 md:col-span-6"
            >
              <div>
                <h3 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                  Educadores e escolas
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                    <span>Organize turmas com código de convite direto para seus alunos.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                    <span>Acompanhe interesses e progresso da turma em visão agregada.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                    <span>Respeite a privacidade individual: respostas pessoais não são expostas.</span>
                  </li>
                </ul>
              </div>

              <div>
                <ButtonLink
                  href="/cadastro"
                  variant="outline"
                  size="md"
                  rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  Criar conta de educador
                </ButtonLink>
              </div>
            </div>
          </StaggerGroup>
        </div>
      </section>

      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5 sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                Privacidade pensada para adolescentes
              </h2>
              <p className="text-sm text-[var(--ink-muted)]">
                Seguimos a LGPD com proteção especial aos dados de jovens, sem
                anúncios e sem venda de informações.
              </p>
            </div>
          </div>

          <Link
            href="/privacidade"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            <span>Ler política de privacidade</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="bg-[var(--brand-primary-deep)] px-4 py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl space-y-5">
          <SplitTextReveal
            text="Pronto para testar na prática?"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          />
          <p className="text-base text-[var(--brand-primary-ink-on-dark)]">
            Crie sua conta gratuita e comece pelo mapa de afinidades em poucos
            minutos.
          </p>
          <div className="pt-2">
            <ButtonLink
              href="/cadastro"
              variant="secondary"
              size="lg"
              className="bg-white text-[var(--brand-primary-deep)] hover:bg-[var(--bg-canvas)]"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Criar minha conta
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
