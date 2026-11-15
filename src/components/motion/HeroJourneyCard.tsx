"use client";

import { useRef } from "react";
import { BookOpen, Check, Compass, FlaskConical, Hammer, Lock } from "lucide-react";
import { Badge, Card, type StageKey } from "@/components/ui";
import { gsap, MOTION_EASE, useGSAP } from "@/lib/gsap";

export interface HeroJourneyStage {
  key: StageKey;
  title: string;
  iconClasses: string;
  stepOffset: string;
  previewBadge?: string;
  previewDone?: boolean;
  previewLocked?: boolean;
}

const STAGE_ICONS: Record<StageKey, typeof Compass> = {
  DESCOBRIR: Compass,
  APRENDER: BookOpen,
  EXPERIMENTAR: FlaskConical,
  CONSTRUIR: Hammer,
};

interface HeroJourneyCardProps {
  stages: HeroJourneyStage[];
}

export function HeroJourneyCard({ stages }: HeroJourneyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = cardRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const steps = container.querySelectorAll<HTMLElement>("[data-journey-step]");
        const lines = container.querySelectorAll<HTMLElement>("[data-journey-line]");

        const tl = gsap.timeline({
          defaults: { ease: MOTION_EASE.enter },
        });

        steps.forEach((step, index) => {
          tl.from(
            step,
            {
              y: 12,
              opacity: 0,
              duration: 0.42,
            },
            index === 0 ? 0.1 : ">-0.05",
          );

          const line = lines[index];
          if (line) {
            tl.from(
              line,
              {
                scaleY: 0,
                transformOrigin: "top center",
                duration: 0.28,
              },
              ">-0.12",
            );
          }
        });
      });
    },
    { scope: cardRef },
  );

  return (
    <div ref={cardRef}>
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
          <Badge variant="success" className="shrink-0 whitespace-nowrap">
            4 etapas
          </Badge>
        </div>

        <ol className="relative mt-4 space-y-4">
          {stages.map((stage, index) => {
            const Icon = STAGE_ICONS[stage.key];
            const isLast = index === stages.length - 1;

            return (
              <li
                key={stage.key}
                data-journey-step
                className="relative flex items-center justify-between gap-3"
              >
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    data-journey-line
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
  );
}
