import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  ExternalLink,
  FlaskConical,
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
import { SharedPortfolioView } from "@/components/portfolio/SharedPortfolioView";
import { Badge, type BadgeVariant, ButtonLink, type StageKey } from "@/components/ui";
import {
  DEMO_PORTFOLIO,
  DEMO_PORTFOLIO_TOKEN,
} from "@/lib/portfolio/demo-portfolio";

const stages: Array<{
  key: StageKey;
  badgeVariant: BadgeVariant;
  number: string;
  title: string;
  description: string;
  outcome: string;
  Icon: typeof Compass;
  nodeClasses: string;
  iconClasses: string;
  hoverClasses: string;
  previewBadge?: string;
  previewDone?: boolean;
  previewLocked?: boolean;
}> = [
  {
    key: "DESCOBRIR",
    badgeVariant: "discover",
    number: "1",
    title: "Descobrir",
    description:
      "Responda a cenários práticos e mapeie quais áreas despertam sua curiosidade.",
    outcome: "Entrega: mapa de afinidades",
    Icon: Compass,
    nodeClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-discover-ink)_24%,var(--stage-discover-border))] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)]",
    iconClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-discover-ink)_24%,var(--stage-discover-border))] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)]",
    hoverClasses: "hover:bg-[var(--stage-discover-bg)]/45",
    previewDone: true,
  },
  {
    key: "APRENDER",
    badgeVariant: "learn",
    number: "2",
    title: "Aprender",
    description:
      "Estude em trilhas curtas e gratuitas escolhidas a partir dos seus interesses.",
    outcome: "Entrega: trilhas concluídas",
    Icon: BookOpen,
    nodeClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-learn-ink)_24%,var(--stage-learn-border))] bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)]",
    iconClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-learn-ink)_24%,var(--stage-learn-border))] bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)]",
    hoverClasses: "hover:bg-[var(--stage-learn-bg)]/45",
    previewDone: true,
  },
  {
    key: "EXPERIMENTAR",
    badgeVariant: "experiment",
    number: "3",
    title: "Experimentar",
    description:
      "Resolva desafios práticos baseados em situações reais de trabalho e estudo.",
    outcome: "Entrega: projetos práticos",
    Icon: FlaskConical,
    nodeClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-experiment-ink)_26%,var(--stage-experiment-border))] bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)]",
    iconClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-experiment-ink)_26%,var(--stage-experiment-border))] bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)]",
    hoverClasses: "hover:bg-[var(--stage-experiment-bg)]/45",
    previewBadge: "Em andamento",
  },
  {
    key: "CONSTRUIR",
    badgeVariant: "build",
    number: "4",
    title: "Construir",
    description:
      "Organize suas entregas e reflexões em um portfólio com link compartilhável.",
    outcome: "Entrega: portfólio próprio",
    Icon: Hammer,
    nodeClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-build-ink)_26%,var(--stage-build-border))] bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]",
    iconClasses:
      "border-[1.5px] border-[color-mix(in_srgb,var(--stage-build-ink)_26%,var(--stage-build-border))] bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]",
    hoverClasses: "hover:bg-[var(--stage-build-bg)]/45",
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
              <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink-primary)] sm:text-5xl sm:leading-[1.08]">
                Teste caminhos antes de escolher uma profissão.
              </h1>

              <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-[var(--ink-secondary)] sm:text-lg">
                Mapeie suas áreas de afinidade, estude em trilhas curtas
                gratuitas, resolva desafios reais e monte um portfólio com o que
                você já sabe fazer.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink
                  href="/cadastro"
                  variant="primary"
                  size="lg"
                  rightIcon={
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  }
                >
                  Criar conta gratuita
                </ButtonLink>
                <ButtonLink href="#como-funciona" variant="outline" size="lg">
                  Ver o percurso
                </ButtonLink>
              </div>

              <p className="mt-5 text-xs font-medium text-[var(--ink-muted)]">
                Gratuito para estudantes do Ensino Médio e escolas parceiras
                (acesso com código da turma ou instituição). Sem anúncios.
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
        aria-labelledby="percurso-heading"
        className="scroll-mt-24 bg-[var(--bg-surface)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl space-y-2.5">
            <SplitTextReveal
              id="percurso-heading"
              text="Um percurso em quatro fases, no seu ritmo"
              className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
            <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Você não precisa chegar com tudo decidido. Cada etapa prepara a
              seguinte, da curiosidade inicial até um projeto publicado.
            </p>
          </div>

          <div className="mt-12">
            <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage, index) => {
                const { Icon } = stage;
                const isLast = index === stages.length - 1;

                return (
                  <div key={stage.key} data-motion-item>
                    <article
                      className={`flex h-full flex-col justify-between rounded-2xl p-4 transition-colors duration-200 ${stage.hoverClasses}`}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stage.nodeClasses}`}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <Badge variant={stage.badgeVariant} mono>
                            Passo {stage.number}
                          </Badge>
                          {!isLast ? (
                            <span
                              aria-hidden="true"
                              className="hidden h-px flex-1 bg-[var(--border-strong)] lg:block"
                            />
                          ) : null}
                        </div>

                        <h3 className="mt-5 font-display text-xl font-bold text-[var(--ink-primary)]">
                          {stage.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                          {stage.description}
                        </p>
                      </div>

                      <p className="mt-5 pt-3 text-xs font-semibold text-[var(--brand-primary)]">
                        {stage.outcome}
                      </p>
                    </article>
                  </div>
                );
              })}
            </StaggerGroup>
          </div>
        </div>
      </section>

      <section
        id="na-pratica"
        aria-labelledby="na-pratica-heading"
        className="scroll-mt-24 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl space-y-2.5">
            <SplitTextReveal
              id="na-pratica-heading"
              text="O que você produz ao longo do percurso"
              className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
            <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Em vez de ficar só na teoria, você visualiza suas afinidades e
              reúne suas entregas em um portfólio pronto para compartilhar.
            </p>
          </div>

          <StaggerGroup className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-start">
            <div
              data-motion-item
              className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 lg:col-span-6"
            >
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--ink-primary)]">
                  Mapa de afinidades
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Suas respostas no Descobrir geram um painel visual das áreas
                  que mais combinam com você.
                </p>
              </div>

              <AffinityPreviewCard />
            </div>

            <div
              data-motion-item
              className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 lg:col-span-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl font-bold text-[var(--ink-primary)]">
                    Portfólio compartilhável do estudante
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink-secondary)]">
                    Cada desafio concluído ou projeto autoral vira um registro
                    organizado sob seu controle.
                  </p>
                </div>

                <ButtonLink
                  href={`/p/${DEMO_PORTFOLIO_TOKEN}`}
                  variant="outline"
                  size="sm"
                  rightIcon={
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  }
                >
                  Ver exemplo completo
                </ButtonLink>
              </div>

              <SharedPortfolioView
                portfolio={DEMO_PORTFOLIO}
                shareToken={DEMO_PORTFOLIO_TOKEN}
                isDemo
                compact
              />
            </div>
          </StaggerGroup>
        </div>
      </section>

      <section
        id="para-quem"
        aria-labelledby="para-quem-heading"
        className="scroll-mt-24 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl space-y-2.5">
            <SplitTextReveal
              id="para-quem-heading"
              text="Feito para o estudante, preparado para a escola"
              className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
          </div>

          <StaggerGroup className="mt-10 grid gap-8 md:grid-cols-12">
            <div
              data-motion-item
              className="flex flex-col justify-between gap-6 py-2 md:col-span-6"
            >
              <div>
                <h3 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                  Estudantes
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]"
                      aria-hidden="true"
                    />
                    <span>
                      Explore áreas profissionais sem pressão de acertar de
                      primeira.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]"
                      aria-hidden="true"
                    />
                    <span>
                      Faça trilhas curtas gratuitas e desafios práticos no seu
                      tempo.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]"
                      aria-hidden="true"
                    />
                    <span>
                      Escolha quais projetos ficam visíveis no seu link de
                      portfólio.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <ButtonLink href="/cadastro" variant="primary" size="md">
                  Criar conta de estudante
                </ButtonLink>
              </div>
            </div>

            <div
              data-motion-item
              className="flex flex-col justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-6 md:col-span-6"
            >
              <div>
                <h3 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                  Educadores e escolas
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                      aria-hidden="true"
                    />
                    <span>
                      Organize turmas com código de convite direto para seus
                      alunos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                      aria-hidden="true"
                    />
                    <span>
                      Acompanhe interesses e progresso da turma em visão
                      agregada.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                      aria-hidden="true"
                    />
                    <span>
                      Respeite a privacidade individual: respostas pessoais não
                      são expostas.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <ButtonLink
                  href="/cadastro?role=EDUCADOR"
                  variant="outline"
                  size="md"
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
          </Link>
        </div>
      </section>

      <section className="bg-[var(--brand-primary-deep)] px-4 py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl space-y-5">
          <SplitTextReveal
            text="Comece pelo seu mapa de afinidades"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          />
          <p className="text-base text-[var(--brand-primary-ink-on-dark)]">
            Use o código da sua turma ou instituição para criar sua conta
            gratuita e dar o primeiro passo.
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
