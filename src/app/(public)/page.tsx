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
  GraduationCap,
  Hammer,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  AffinityPreviewCard,
  HeroJourneyCard,
  type HeroJourneyStage,
  ParallaxOrb,
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
  href: string;
  Icon: typeof Compass;
  iconClasses: string;
  hoverClasses: string;
  linkColor: string;
  stepOffset: string;
  previewBadge?: string;
  previewDone?: boolean;
  previewLocked?: boolean;
}> = [
  {
    key: "DESCOBRIR",
    number: "01",
    title: "Descobrir",
    description:
      "Entenda seus interesses e conheça caminhos possíveis.",
    href: "/cadastro",
    Icon: Compass,
    iconClasses:
      "border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[#F3E8FF]/65 hover:border-[var(--stage-discover-border)]",
    linkColor: "text-[var(--stage-discover-ink)]",
    stepOffset: "sm:ml-0",
    previewDone: true,
  },
  {
    key: "APRENDER",
    number: "02",
    title: "Aprender",
    description:
      "Desenvolva habilidades com trilhas curtas e práticas.",
    href: "/cadastro",
    Icon: BookOpen,
    iconClasses:
      "border-[var(--stage-learn-border)] bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[#E0F2FE]/65 hover:border-[var(--stage-learn-border)]",
    linkColor: "text-[var(--stage-learn-ink)]",
    stepOffset: "sm:ml-4",
    previewDone: true,
  },
  {
    key: "EXPERIMENTAR",
    number: "03",
    title: "Experimentar",
    description:
      "Resolva desafios reais e teste suas habilidades.",
    href: "/cadastro",
    Icon: FlaskConical,
    iconClasses:
      "border-[var(--stage-experiment-border)] bg-[var(--stage-experiment-bg)] text-[var(--stage-experiment-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[#FEF3C7]/65 hover:border-[var(--stage-experiment-border)]",
    linkColor: "text-[var(--stage-experiment-ink)]",
    stepOffset: "sm:ml-8",
    previewBadge: "Em andamento",
  },
  {
    key: "CONSTRUIR",
    number: "04",
    title: "Construir",
    description:
      "Reúna suas conquistas em um portfólio só seu.",
    href: "/cadastro",
    Icon: Hammer,
    iconClasses:
      "border-[var(--stage-build-border)] bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]",
    hoverClasses:
      "hover:scale-[1.03] hover:bg-[#D1FAE5]/65 hover:border-[var(--stage-build-border)]",
    linkColor: "text-[var(--stage-build-ink)]",
    stepOffset: "sm:ml-12",
    previewLocked: true,
  },
];

const heroStages: HeroJourneyStage[] = stages.map(
  ({
    key,
    title,
    iconClasses,
    stepOffset,
    previewBadge,
    previewDone,
    previewLocked,
  }) => ({
    key,
    title,
    iconClasses,
    stepOffset,
    previewBadge,
    previewDone,
    previewLocked,
  }),
);

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Badge variant="brand">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Seu futuro começa com curiosidade</span>
            </Badge>

            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--ink-primary)] sm:text-5xl sm:leading-[1.12]">
              Descubra possibilidades. Desenvolva habilidades.{" "}
              <span className="text-[var(--brand-primary)]">
                Construa seu caminho.
              </span>
            </h1>

            <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
              Uma plataforma gratuita para você conhecer carreiras, aprender na
              prática e mostrar ao mundo tudo que é capaz de criar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink
                href="/cadastro"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                Quero começar
              </ButtonLink>
              <ButtonLink
                href="#como-funciona"
                variant="outline"
                size="lg"
                leftIcon={<Play className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Ver como funciona
              </ButtonLink>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs font-medium text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <Check
                  className="h-3.5 w-3.5 text-[var(--stage-build-ink)]"
                  aria-hidden="true"
                />
                100% gratuito
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check
                  className="h-3.5 w-3.5 text-[var(--stage-build-ink)]"
                  aria-hidden="true"
                />
                Feito para estudantes
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroJourneyCard stages={heroStages} />
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        aria-labelledby="jornada-heading"
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <Badge variant="brand">COMO FUNCIONA</Badge>
            <SplitTextReveal
              id="jornada-heading"
              text="Um passo de cada vez. Um mundo de possibilidades."
              className="font-display text-2xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            >
              Um passo de cada vez.
              <br />
              Um mundo de possibilidades.
            </SplitTextReveal>
            <p className="mx-auto max-w-[54ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Você não precisa ter tudo decidido. Comece explorando e avance no
              seu ritmo.
            </p>
          </div>

          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage) => {
              const { Icon } = stage;

              return (
                <div key={stage.key} data-motion-item className="flex">
                  <Card
                    as="article"
                    variant="interactive"
                    padding="md"
                    className={`flex w-full flex-col justify-between gap-5 transition-all duration-300 ease-out ${stage.hoverClasses}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${stage.iconClasses}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-xs font-semibold text-[var(--ink-muted)]">
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

                    <Link
                      href={stage.href}
                      className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80 ${stage.linkColor}`}
                    >
                      <span>Explorar etapa</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Card>
                </div>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <section
        id="na-pratica"
        aria-labelledby="na-pratica-heading"
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <Badge variant="brand">NA PRÁTICA</Badge>
            <SplitTextReveal
              id="na-pratica-heading"
              text="Do interesse ao portfólio real."
              className="font-display text-2xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
            <p className="mx-auto max-w-[56ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Cada etapa gera resultados concretos que ajudam você a enxergar
              seus talentos e compartilhar o que construiu.
            </p>
          </div>

          <StaggerGroup className="mt-10 grid gap-6 lg:grid-cols-2">
            <div data-motion-item className="flex">
              <Card variant="default" padding="lg" className="flex w-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--stage-discover-ink)]">
                      <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                      Mapa de Afinidades
                    </span>
                    <span className="font-mono text-xs text-[var(--ink-muted)]">
                      Etapa 01 · Descobrir
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold text-[var(--ink-primary)]">
                    Descubra áreas que combinam com você
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">
                    Responda ao questionário inicial e veja suas 3 principais
                    macroáreas conectadas a trilhas gratuitas.
                  </p>
                </div>

                <AffinityPreviewCard />
              </Card>
            </div>

            <div data-motion-item className="flex">
              <Card variant="default" padding="lg" className="flex w-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--stage-build-border)] bg-[var(--stage-build-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--stage-build-ink)]">
                      <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                      Portfólio Compartilhável
                    </span>
                    <span className="font-mono text-xs text-[var(--ink-muted)]">
                      Etapa 04 · Construir
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold text-[var(--ink-primary)]">
                    Evidências reais do que você sabe fazer
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">
                    Desafios concluídos e projetos pessoais viram um portfólio
                    organizado, com link público sob seu controle.
                  </p>
                </div>

                <Card
                  as="article"
                  padding="sm"
                  className="grid overflow-hidden p-0 sm:grid-cols-12 sm:p-0"
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
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Acessar link</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>guia-profissoes.pdf · 1.2 MB</span>
                      </span>
                    </div>
                  </div>
                </Card>
              </Card>
            </div>
          </StaggerGroup>
        </div>
      </section>

      <section
        id="para-quem"
        aria-labelledby="para-quem-heading"
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl space-y-2.5 text-center">
            <Badge variant="brand">PARA QUEM É</Badge>
            <SplitTextReveal
              id="para-quem-heading"
              text="Feito para estudantes. Pensado para educadores."
              className="font-display text-2xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            />
            <p className="mx-auto max-w-[56ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Aproxime escola e mundo do trabalho respeitando o ritmo de cada
              jovem e a privacidade da turma.
            </p>
          </div>

          <StaggerGroup className="mt-10 grid gap-6 md:grid-cols-2">
            <div data-motion-item className="flex">
              <Card variant="default" padding="lg" className="flex w-full flex-col justify-between gap-6">
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                    <GraduationCap className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold text-[var(--ink-primary)]">
                    Para Estudantes
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-[var(--ink-secondary)]">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]" aria-hidden="true" />
                      <span>Explore carreiras e afinidades sem pressão de escolher tudo agora.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]" aria-hidden="true" />
                      <span>Trilhas curtas gratuitas e desafios práticos no seu ritmo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-build-ink)]" aria-hidden="true" />
                      <span>Você decide quais projetos aparecem no seu portfólio compartilhável.</span>
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
                    Começar como estudante
                  </ButtonLink>
                </div>
              </Card>
            </div>

            <div data-motion-item className="flex">
              <Card variant="default" padding="lg" className="flex w-full flex-col justify-between gap-6">
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--stage-learn-border)] bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)]">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold text-[var(--ink-primary)]">
                    Para Educadores e Escolas
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-[var(--ink-secondary)]">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-learn-ink)]" aria-hidden="true" />
                      <span>Crie turmas com código de convite simples para seus estudantes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-learn-ink)]" aria-hidden="true" />
                      <span>Acompanhe interesses e evolução da turma em visão agregada.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--stage-learn-ink)]" aria-hidden="true" />
                      <span>Respeito total à privacidade individual e respostas pessoais dos alunos.</span>
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
              </Card>
            </div>
          </StaggerGroup>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Card variant="default" padding="md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5 sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                  Seus dados são seus.
                </h2>
                <p className="text-sm text-[var(--ink-muted)]">
                  Privacidade e segurança desde o primeiro passo. Seguimos a LGPD
                  com proteção especial aos dados de adolescentes e nunca
                  vendemos suas informações.
                </p>
              </div>
            </div>

            <Link
              href="/privacidade"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <span>Conheça nosso compromisso</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary-deep)] to-[var(--brand-primary)] px-4 py-16 text-center text-white sm:py-20">
        <ParallaxOrb
          offsetY={-20}
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10"
        />
        <ParallaxOrb
          offsetY={24}
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10"
        />

        <div className="relative z-10 mx-auto max-w-2xl space-y-5">
          <SplitTextReveal
            text="Pronto para virar a chave?"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          />
          <p className="text-base text-[var(--brand-primary-ink-on-dark)]">
            Seu caminho não precisa estar pronto. Só precisa começar.
          </p>
          <div className="pt-2">
            <ButtonLink
              href="/cadastro"
              variant="secondary"
              size="lg"
              className="bg-white text-[var(--brand-primary-deep)] hover:bg-[var(--bg-canvas)]"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Criar minha conta grátis
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
