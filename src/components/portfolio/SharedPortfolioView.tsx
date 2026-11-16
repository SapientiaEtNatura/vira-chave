import { ExternalLink, FileText, FolderKanban, ShieldCheck } from "lucide-react";
import { Badge, BrandLogo, Card } from "@/components/ui";
import type { SharedPortfolioView as SharedPortfolioData } from "@/lib/portfolio/portfolio-service";

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

const COVER_PALETTES = [
  {
    bg: "bg-[var(--stage-experiment-bg)]",
    ink: "text-[var(--stage-experiment-ink)]",
  },
  {
    bg: "bg-[var(--stage-learn-bg)]",
    ink: "text-[var(--stage-learn-ink)]",
  },
  {
    bg: "bg-[var(--stage-discover-bg)]",
    ink: "text-[var(--stage-discover-ink)]",
  },
  {
    bg: "bg-[var(--stage-build-bg)]",
    ink: "text-[var(--stage-build-ink)]",
  },
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

  return (
    <div className="space-y-4">
      <Card as="section" padding={compact ? "md" : "lg"}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary-deep)] to-[var(--brand-primary)] font-display text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg"
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

          <Badge variant="neutral">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isDemo ? "Exemplo demonstrativo" : "Visualização somente leitura"}
            </span>
          </Badge>
        </div>
      </Card>

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
            const palette = COVER_PALETTES[index % COVER_PALETTES.length];
            const numberLabel = `PROJETO ${String(index + 1).padStart(2, "0")}`;

            return (
              <Card
                key={project.id}
                as="article"
                padding="sm"
                className="grid overflow-hidden p-0 sm:grid-cols-12 sm:p-0"
              >
                <div
                  className={`relative flex min-h-32 flex-col items-center justify-center p-5 sm:col-span-4 ${palette.bg} ${palette.ink}`}
                >
                  <span className="absolute left-4 top-3.5 font-mono text-xs font-semibold tracking-wider opacity-80">
                    {numberLabel}
                  </span>
                  <FolderKanban className="h-8 w-8" aria-hidden="true" />
                </div>

                <div className="flex flex-col justify-between p-5 sm:col-span-8">
                  <div>
                    {project.challengeTitle ? (
                      <div className="mb-2">
                        <Badge variant="brand">
                          Desafio: {project.challengeTitle}
                        </Badge>
                      </div>
                    ) : null}

                    {compact ? (
                      <h4 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                        {project.title}
                      </h4>
                    ) : (
                      <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                        {project.title}
                      </h2>
                    )}

                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {project.summary}
                    </p>

                    <p className="mt-3 whitespace-pre-line rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
                      {project.reflection}
                    </p>
                  </div>

                  {project.externalUrl || project.evidenceFiles.length > 0 ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                      {project.externalUrl ? (
                        <a
                          href={project.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft)] hover:underline"
                        >
                          <ExternalLink
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          <span>Acessar link</span>
                        </a>
                      ) : null}

                      {project.evidenceFiles.map((file) =>
                        isDemo || !shareToken ? (
                          <span
                            key={file.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)]"
                          >
                            <FileText
                              className="h-3.5 w-3.5 text-[var(--brand-primary)]"
                              aria-hidden="true"
                            />
                            <span>
                              {file.originalName} ({formatFileSize(file.sizeBytes)})
                            </span>
                          </span>
                        ) : (
                          <a
                            key={file.id}
                            href={`/api/files/${file.id}?shareToken=${encodeURIComponent(shareToken)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]"
                          >
                            <FileText
                              className="h-3.5 w-3.5 text-[var(--brand-primary)]"
                              aria-hidden="true"
                            />
                            <span>
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
    </div>
  );
}
