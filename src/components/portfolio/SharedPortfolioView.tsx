import {
  Award,
  ExternalLink,
  FileText,
  FlaskConical,
  Hammer,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  BrandLogo,
  Card,
  type BadgeVariant,
} from "@/components/ui";
import type { PublicReadinessLabel } from "@/lib/discovery/readiness";
import type { SharedPortfolioView as SharedPortfolioData } from "@/lib/portfolio/portfolio-service";

function getReadinessBadgeVariant(label: PublicReadinessLabel): BadgeVariant {
  if (label === "Prática comprovada") return "success";
  if (label === "Em formação") return "brand";
  return "neutral";
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCENT_STRIPS = [
  "bg-[var(--brand-primary)]",
  "bg-[var(--stage-experiment-ink)]",
  "bg-[var(--stage-learn-ink)]",
  "bg-[var(--stage-build-ink)]",
];

interface SharedPortfolioViewProps {
  portfolio: SharedPortfolioData;
  shareToken?: string;
  isDemo?: boolean;
  compact?: boolean;
}

export function SharedPortfolioView({
  portfolio,
  shareToken,
  isDemo = false,
  compact = false,
}: SharedPortfolioViewProps) {
  const initials = portfolio.studentDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const visibleProjects = compact
    ? portfolio.projects.slice(0, 1)
    : portfolio.projects;
  const hiddenCount = compact
    ? Math.max(0, portfolio.projects.length - visibleProjects.length)
    : 0;

  return (
    <div className="space-y-4">
      <Card as="section" padding={compact ? "md" : "lg"}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary-deep)] font-display text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg"
            >
              {initials || "VC"}
            </div>
            <div className="space-y-1">
              <BrandLogo subtitle="Portfólio Compartilhado" />
              {compact ? (
                <p className="font-display text-lg font-bold tracking-tight text-[var(--ink-primary)] sm:text-xl">
                  {portfolio.studentDisplayName}
                </p>
              ) : (
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink-primary)] sm:text-3xl">
                  {portfolio.studentDisplayName}
                </h1>
              )}
            </div>
          </div>

          <Badge
            variant="neutral"
            size="md"
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            {isDemo ? "Exemplo ilustrativo" : "Visualização somente leitura"}
          </Badge>
        </div>
      </Card>

      {!compact && portfolio.readinessSummary ? (
        <Card
          as="section"
          aria-labelledby="shared-readiness-heading"
          padding="md"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award
                  className="h-4 w-4 text-[var(--brand-primary)]"
                  aria-hidden="true"
                />
                <h2
                  id="shared-readiness-heading"
                  className="font-display text-lg font-bold text-[var(--ink-primary)]"
                >
                  Cartão de Prontidão
                </h2>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                Resumo público de cursos concluídos, desafios resolvidos e
                funções de entrada ligadas às entregas deste portfólio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                {portfolio.readinessSummary.completedCoursesCount}{" "}
                {portfolio.readinessSummary.completedCoursesCount === 1
                  ? "curso concluído"
                  : "cursos concluídos"}
              </Badge>
              <Badge variant="neutral">
                {portfolio.readinessSummary.completedChallengesCount}{" "}
                {portfolio.readinessSummary.completedChallengesCount === 1
                  ? "desafio concluído"
                  : "desafios concluídos"}
              </Badge>
              <Badge variant="neutral">
                {portfolio.readinessSummary.totalProjectsCount}{" "}
                {portfolio.readinessSummary.totalProjectsCount === 1
                  ? "projeto compartilhado"
                  : "projetos compartilhados"}
              </Badge>
            </div>
          </div>

          {portfolio.readinessSummary.topAreas.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {portfolio.readinessSummary.topAreas.map((area) => (
                <div
                  key={area.slug}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-[var(--ink-primary)]">
                        {area.name}
                      </h3>
                      <Badge
                        variant={getReadinessBadgeVariant(
                          area.publicStatusLabel,
                        )}
                      >
                        {area.publicStatusLabel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--ink-secondary)]">
                      {area.affinityScore !== null ? (
                        <span>Afinidade: {area.affinityScore}%</span>
                      ) : null}
                      <span>Prática comprovada: {area.provenScore}%</span>
                    </div>
                  </div>

                  {area.entryRoles.length > 0 ? (
                    <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2.5">
                      <p className="text-xs font-semibold text-[var(--ink-muted)]">
                        Funções de entrada
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {area.entryRoles.slice(0, 3).map((role) => (
                          <Badge key={role} variant="neutral">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {visibleProjects.length === 0 ? (
        <Card padding="lg" className="border-dashed text-center">
          <p className="text-sm text-[var(--ink-muted)]">
            Nenhum projeto foi incluído neste portfólio compartilhado até o
            momento.
          </p>
        </Card>
      ) : (
        <div className={compact ? "grid gap-4" : "grid gap-5 lg:grid-cols-2"}>
          {visibleProjects.map((project, index) => {
            const stripColor = ACCENT_STRIPS[index % ACCENT_STRIPS.length];
            const isChallenge = Boolean(project.challengeTitle);
            const attachmentCount =
              project.evidenceFiles.length + (project.externalUrl ? 1 : 0);

            return (
              <Card
                key={project.id}
                as="article"
                padding="sm"
                className="flex flex-col overflow-hidden p-0 sm:p-0"
              >
                <div aria-hidden="true" className={`h-1.5 w-full ${stripColor}`} />

                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={isChallenge ? "experiment" : "build"}
                          icon={
                            isChallenge ? (
                              <FlaskConical className="h-3.5 w-3.5" />
                            ) : (
                              <Hammer className="h-3.5 w-3.5" />
                            )
                          }
                        >
                          {isChallenge
                            ? `Desafio: ${project.challengeTitle}`
                            : "Projeto autoral"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                        {attachmentCount > 0 ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Paperclip
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {attachmentCount}{" "}
                            {attachmentCount === 1 ? "evidência" : "evidências"}
                          </span>
                        ) : null}
                        <span className="font-mono font-semibold tabular-nums text-[var(--ink-secondary)]">
                          #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    {compact ? (
                      <h4 className="font-display text-lg font-bold leading-snug text-[var(--ink-primary)]">
                        {project.title}
                      </h4>
                    ) : (
                      <h2 className="font-display text-xl font-bold leading-snug text-[var(--ink-primary)]">
                        {project.title}
                      </h2>
                    )}

                    <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {project.summary}
                    </p>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5">
                      <p className="mb-1 text-xs font-semibold text-[var(--ink-primary)]">
                        O que foi aprendido
                      </p>
                      <p className="whitespace-pre-line text-xs leading-relaxed text-[var(--ink-secondary)]">
                        {project.reflection}
                      </p>
                    </div>
                  </div>

                  {project.externalUrl || project.evidenceFiles.length > 0 ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                      {project.externalUrl ? (
                        <a
                          href={project.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Acessar link externo do projeto ${project.title} (abre em nova aba)`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft)] hover:underline"
                        >
                          <ExternalLink
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>Acessar link</span>
                        </a>
                      ) : null}

                      {project.evidenceFiles.map((file) =>
                        isDemo || !shareToken ? (
                          <span
                            key={file.id}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)]"
                          >
                            <FileText
                              className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {file.originalName} ({formatFileSize(file.sizeBytes)})
                            </span>
                            <span className="shrink-0 text-[var(--ink-muted)]">
                              · amostra
                            </span>
                          </span>
                        ) : (
                          <a
                            key={file.id}
                            href={`/api/files/${file.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Abrir arquivo ${file.originalName} (abre em nova aba)`}
                            className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]"
                          >
                            <FileText
                              className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {file.originalName} ({formatFileSize(file.sizeBytes)})
                            </span>
                          </a>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {hiddenCount > 0 ? (
        <p className="text-center text-xs font-medium text-[var(--ink-muted)]">
          +{hiddenCount}{" "}
          {hiddenCount === 1
            ? "projeto adicional no exemplo completo"
            : "projetos adicionais no exemplo completo"}
        </p>
      ) : null}
    </div>
  );
}
