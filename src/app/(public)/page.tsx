import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  FlaskConical,
  Hammer,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
    linkColor: "text-[var(--stage-build-ink)]",
    stepOffset: "sm:ml-12",
    previewLocked: true,
  },
];

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
            <Card
              variant="default"
              padding="lg"
              aria-label="Prévia visual da jornada em 4 etapas"
              className="shadow-md lg:rotate-1"
            >
              <div className="flex items-start justify-between gap-3 pb-4">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    MINHA JORNADA
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-[var(--ink-primary)]">
                    Seu caminho ganha forma a cada passo.
                  </h2>
                </div>
                <Badge variant="success">4 etapas</Badge>
              </div>

              <ol className="relative mt-4 space-y-4">
                {stages.map((stage, index) => {
                  const { Icon } = stage;
                  const isLast = index === stages.length - 1;

                  return (
                    <li
                      key={stage.key}
                      className={`relative flex items-center justify-between gap-3 ${stage.stepOffset}`}
                    >
                      {!isLast ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-5 top-10 h-6 w-px border-l border-dashed border-[var(--border-strong)]"
                        />
                      ) : null}

                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stage.iconClasses}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <span className="block font-mono text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                            ETAPA {index + 1}
                          </span>
                          <span className="font-display text-sm font-bold text-[var(--ink-primary)]">
                            {stage.title}
                          </span>
                        </div>
                      </div>

                      {stage.previewDone ? (
                        <span
                          aria-label="Etapa concluída"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      ) : stage.previewBadge ? (
                        <span className="rounded-full bg-[var(--stage-experiment-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--stage-experiment-ink)]">
                          {stage.previewBadge}
                        </span>
                      ) : stage.previewLocked ? (
                        <Lock
                          className="h-4 w-4 shrink-0 text-[var(--ink-muted)]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </Card>
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
            <h2
              id="jornada-heading"
              className="font-display text-2xl font-bold text-[var(--ink-primary)] sm:text-4xl"
            >
              Um passo de cada vez.
              <br />
              Um mundo de possibilidades.
            </h2>
            <p className="mx-auto max-w-[54ch] text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Você não precisa ter tudo decidido. Comece explorando e avance no
              seu ritmo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage) => {
              const { Icon } = stage;

              return (
                <Card
                  key={stage.key}
                  as="article"
                  variant="interactive"
                  padding="md"
                  className="flex flex-col justify-between gap-5"
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
              );
            })}
          </div>
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
                  e nunca vendemos seus dados.
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10"
        />

        <div className="relative z-10 mx-auto max-w-2xl space-y-5">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pronto para virar a chave?
          </h2>
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
