"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

export interface PortfolioEvidenceItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PortfolioProjectItem {
  id: string;
  challengeId: string | null;
  challengeTitle: string | null;
  title: string;
  summary: string;
  reflection: string;
  externalUrl: string | null;
  isIncludedInShare: boolean;
  createdAt: string;
  updatedAt: string;
  evidenceFiles: PortfolioEvidenceItem[];
}

export interface InitialShareState {
  hasActiveLink: boolean;
  createdAt: string | null;
}

interface PortfolioManagerClientProps {
  initialProjects: PortfolioProjectItem[];
  initialShareState: InitialShareState;
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortfolioManagerClient({
  initialProjects,
  initialShareState,
}: PortfolioManagerClientProps) {
  const [projects, setProjects] = useState<PortfolioProjectItem[]>(initialProjects);
  const [hasActiveLink, setHasActiveLink] = useState(
    initialShareState.hasActiveLink,
  );
  const [shareCreatedAt, setShareCreatedAt] = useState<string | null>(
    initialShareState.createdAt,
  );
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Novo projeto
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [reflection, setReflection] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isIncludedInShare, setIsIncludedInShare] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editReflection, setEditReflection] = useState("");
  const [editExternalUrl, setEditExternalUrl] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const shareUrl =
    generatedToken && typeof window !== "undefined"
      ? `${window.location.origin}/p/${generatedToken}`
      : generatedToken
        ? `/p/${generatedToken}`
        : null;

  const sharedCount = projects.filter((p) => p.isIncludedInShare).length;

  async function handleGenerateShareLink() {
    setShareBusy(true);
    setShareError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/portfolio/share", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setShareError(data.error || "Não foi possível gerar o link.");
        return;
      }
      setGeneratedToken(data.rawToken);
      setHasActiveLink(true);
      setShareCreatedAt(data.createdAt);
    } catch {
      setShareError("Erro de conexão ao gerar o link de compartilhamento.");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleRevokeShareLink() {
    setShareBusy(true);
    setShareError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/portfolio/share", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setShareError(data.error || "Não foi possível revogar o link.");
        return;
      }
      setGeneratedToken(null);
      setHasActiveLink(false);
      setShareCreatedAt(null);
    } catch {
      setShareError("Erro de conexão ao revogar o link.");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError("Não foi possível copiar automaticamente. Selecione e copie o link.");
    }
  }

  async function handleCreateProject(event: React.FormEvent) {
    event.preventDefault();
    setCreateBusy(true);
    setCreateError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("summary", summary);
      formData.append("reflection", reflection);
      formData.append("externalUrl", externalUrl);
      formData.append("isIncludedInShare", String(isIncludedInShare));
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/portfolio/projects", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setCreateError(data.error || "Não foi possível criar o projeto.");
        return;
      }

      setProjects((prev) => [data.project, ...prev]);
      setTitle("");
      setSummary("");
      setReflection("");
      setExternalUrl("");
      setIsIncludedInShare(true);
      setFile(null);
      setShowCreateForm(false);
    } catch {
      setCreateError("Erro de conexão ao criar projeto.");
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleToggleShare(project: PortfolioProjectItem) {
    setActionError(null);
    const nextValue = !project.isIncludedInShare;

    try {
      const response = await fetch(`/api/portfolio/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isIncludedInShare: nextValue }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error || "Não foi possível atualizar visibilidade.");
        return;
      }
      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? data.project : item)),
      );
    } catch {
      setActionError("Erro de conexão ao atualizar projeto.");
    }
  }

  function startEditing(project: PortfolioProjectItem) {
    setEditingId(project.id);
    setEditTitle(project.title);
    setEditSummary(project.summary);
    setEditReflection(project.reflection);
    setEditExternalUrl(project.externalUrl ?? "");
    setActionError(null);
  }

  async function handleSaveEdit(projectId: string) {
    setEditBusy(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/portfolio/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          reflection: editReflection,
          externalUrl: editExternalUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error || "Não foi possível salvar as alterações.");
        return;
      }
      setProjects((prev) =>
        prev.map((item) => (item.id === projectId ? data.project : item)),
      );
      setEditingId(null);
    } catch {
      setActionError("Erro de conexão ao salvar alterações.");
    } finally {
      setEditBusy(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este projeto e seus arquivos anexados?",
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      const response = await fetch(`/api/portfolio/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error || "Não foi possível excluir o projeto.");
        return;
      }
      setProjects((prev) => prev.filter((item) => item.id !== projectId));
    } catch {
      setActionError("Erro de conexão ao excluir o projeto.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Seção de Link Compartilhável */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Privado por padrão · Zero PII</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Link Compartilhável do Portfólio
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Somente projetos marcados como visíveis ({sharedCount} de{" "}
              {projects.length}) aparecem no link público. E-mail, escola e
              turma nunca são exibidos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateShareLink}
              disabled={shareBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              <span>
                {hasActiveLink
                  ? "Gerar novo link"
                  : "Gerar link compartilhável"}
              </span>
            </button>

            {hasActiveLink && (
              <button
                type="button"
                onClick={handleRevokeShareLink}
                disabled={shareBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Revogar link</span>
              </button>
            )}
          </div>
        </div>

        {shareError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {shareError}
          </p>
        )}

        {shareUrl ? (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all text-xs font-medium text-indigo-900 sm:text-sm">
              {shareUrl}
            </code>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition hover:bg-indigo-100"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiar link</span>
                  </>
                )}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                <span>Abrir</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : hasActiveLink ? (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Você possui um link ativo
            {shareCreatedAt
              ? ` criado em ${new Date(shareCreatedAt).toLocaleDateString("pt-BR")}`
              : ""}
            . Por segurança, o token completo só é exibido no momento da geração;
            gere um novo link se precisar copiá-lo novamente (o anterior será
            revogado).
          </p>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            Nenhum link ativo no momento. Seu portfólio está totalmente privado.
          </p>
        )}
      </section>

      {/* Cabeçalho da Lista + Botão Novo Projeto */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Meus Projetos ({projects.length})
        </h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{showCreateForm ? "Cancelar" : "Novo projeto"}</span>
        </button>
      </div>

      {/* Formulário de Criação */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateProject}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-900">
            Adicionar projeto ao portfólio
          </h3>

          {createError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {createError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-project-title"
                className="block text-sm font-medium text-slate-700"
              >
                Título do projeto *
              </label>
              <input
                id="new-project-title"
                type="text"
                required
                minLength={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: App de coleta seletiva no bairro"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-project-url"
                className="block text-sm font-medium text-slate-700"
              >
                Link externo (opcional)
              </label>
              <input
                id="new-project-url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-project-summary"
              className="block text-sm font-medium text-slate-700"
            >
              Resumo curto (opcional)
            </label>
            <input
              id="new-project-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Se deixar em branco, será gerado a partir da reflexão."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-project-reflection"
              className="block text-sm font-medium text-slate-700"
            >
              O que você construiu e aprendeu? *
            </label>
            <textarea
              id="new-project-reflection"
              required
              minLength={10}
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Conte o problema que resolveu, como testou sua ideia e o que aprendeu."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-project-file"
              className="block text-sm font-medium text-slate-700"
            >
              Evidência (PDF, PNG ou JPG até 5 MB — opcional)
            </label>
            <label
              htmlFor="new-project-file"
              className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 hover:border-indigo-400"
            >
              <Upload className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>
                {file ? `${file.name} (${formatFileSize(file.size)})` : "Selecionar arquivo..."}
              </span>
              <input
                id="new-project-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isIncludedInShare}
              onChange={(e) => setIsIncludedInShare(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span>Incluir este projeto quando eu gerar um link compartilhável</span>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {createBusy ? "Salvando..." : "Salvar projeto"}
            </button>
          </div>
        </form>
      )}

      {actionError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </p>
      )}

      {/* Lista de Projetos */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Você ainda não tem projetos no portfólio. Crie um projeto acima ou
          complete um desafio na etapa Experimentar.
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isEditing = editingId === project.id;

            return (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                      placeholder="Título"
                    />
                    <input
                      type="text"
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      placeholder="Resumo"
                    />
                    <textarea
                      rows={3}
                      value={editReflection}
                      onChange={(e) => setEditReflection(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      placeholder="Reflexão"
                    />
                    <input
                      type="url"
                      value={editExternalUrl}
                      onChange={(e) => setEditExternalUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      placeholder="https://..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(project.id)}
                        disabled={editBusy}
                        className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {editBusy ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {project.title}
                          </h3>
                          {project.challengeTitle && (
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                              Desafio: {project.challengeTitle}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {project.summary}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleShare(project)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                            project.isIncludedInShare
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {project.isIncludedInShare ? (
                            <>
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>No link público</span>
                            </>
                          ) : (
                            <>
                              <EyeOff
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>Apenas privado</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditing(project)}
                          aria-label={`Editar ${project.title}`}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          aria-label={`Excluir ${project.title}`}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      {project.reflection}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
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
                          <span>Ver link externo</span>
                        </a>
                      )}

                      {project.evidenceFiles.map((evidence) => (
                        <a
                          key={evidence.id}
                          href={`/api/files/${evidence.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <FileText
                            className="h-3.5 w-3.5 text-indigo-600"
                            aria-hidden="true"
                          />
                          <span>
                            {evidence.originalName} (
                            {formatFileSize(evidence.sizeBytes)})
                          </span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
