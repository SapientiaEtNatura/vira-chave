import {
  BookOpen,
  Check,
  Compass,
  FlaskConical,
  Hammer,
  Lock,
} from "lucide-react";
import { Badge, Card, type StageKey } from "@/components/ui";

export interface HeroJourneyStage {
  key: StageKey;
  title: string;
  iconClasses: string;
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
  return (
    <Card
      variant="default"
      padding="lg"
      aria-label="Exemplo ilustrativo do percurso em 4 etapas"
      className="border-[var(--border-strong)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <h2 className="font-display text-xl font-bold text-[var(--ink-primary)]">
          Um roteiro em quatro etapas
        </h2>
        <Badge variant="success" className="shrink-0 whitespace-nowrap">
          Exemplo do percurso
        </Badge>
      </div>

      <ol className="relative mt-5 space-y-4">
        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[stage.key];
          const isLast = index === stages.length - 1;

          return (
            <li
              key={stage.key}
              data-journey-step
              style={{ animationDelay: `${index * 160}ms` }}
              className="vc-journey-step relative flex items-center justify-between gap-3"
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  data-journey-line
                  style={{ animationDelay: `${index * 160 + 180}ms` }}
                  className="vc-journey-line absolute left-5 top-10 h-6 w-px border-l border-dashed border-[var(--border-strong)]"
                />
              ) : null}

              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stage.iconClasses}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs font-medium text-[var(--ink-muted)]">
                    Etapa {index + 1}
                  </span>
                  <span className="font-display text-sm font-bold text-[var(--ink-primary)]">
                    {stage.title}
                  </span>
                </div>
              </div>

              {stage.previewDone ? (
                <span
                  aria-label="Etapa concluída"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--stage-build-ink)_28%,var(--stage-build-border))] bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]"
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
              ) : stage.previewBadge ? (
                <Badge variant="experiment">{stage.previewBadge}</Badge>
              ) : stage.previewLocked ? (
                <span
                  aria-label="Próxima etapa"
                  className="inline-flex items-center text-[var(--ink-muted)]"
                >
                  <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
