import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, FolderKanban, ShieldCheck } from "lucide-react";
import { getSharedPortfolioByToken } from "@/lib/portfolio/portfolio-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfólio Compartilhado | VIRA CHAVE",
  robots: {
    index: false,
    follow: false,
  },
};

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SharedPortfolioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const portfolio = await getSharedPortfolioByToken(token);

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FolderKanban className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  VIRA CHAVE · Portfólio Compartilhado
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {portfolio.studentDisplayName}
                </h1>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Visualização somente leitura</span>
            </span>
          </div>
        </header>

        {portfolio.projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Nenhum projeto foi incluído neste portfólio compartilhado até o
            momento.
          </div>
        ) : (
          <div className="space-y-4">
            {portfolio.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {project.title}
                  </h2>
                  {project.challengeTitle && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      Desafio: {project.challengeTitle}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-600">{project.summary}</p>

                <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700">
                  {project.reflection}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {project.externalUrl && (
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      <ExternalLink
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      <span>Acessar link do projeto</span>
                    </a>
                  )}

                  {project.evidenceFiles.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/files/${file.id}?shareToken=${encodeURIComponent(token)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <FileText
                        className="h-3.5 w-3.5 text-indigo-600"
                        aria-hidden="true"
                      />
                      <span>
                        {file.originalName} ({formatFileSize(file.sizeBytes)})
                      </span>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
