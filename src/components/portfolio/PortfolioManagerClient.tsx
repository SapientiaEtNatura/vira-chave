"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  Link2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  FileUploadField,
  FormField,
  Input,
  Textarea,
} from "@/components/ui";

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

  // Confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<PortfolioProjectItem | null>(
    null,
  );
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  async function handleConfirmDeleteProject() {
    if (!deleteTarget) return;

    setDeleteBusy(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/portfolio/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error || "Não foi possível excluir o projeto.");
        return;
      }
      setProjects((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setActionError("Erro de conexão ao excluir o projeto.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra única: Link compartilhável + Novo projeto */}
      <Card as="section" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <Badge variant="success">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Privado por padrão · Seus dados pessoais nunca aparecem</span>
            </Badge>
            <p className="text-sm text-[var(--ink-secondary)]">
              {sharedCount} de {projects.length}{" "}
              {projects.length === 1 ? "projeto visível" : "projetos visíveis"}{" "}
              no link compartilhável.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateShareLink}
              loading={shareBusy}
              leftIcon={<Link2 className="h-4 w-4" aria-hidden="true" />}
            >
              {hasActiveLink
                ? "Gerar novo link"
                : "Gerar link compartilhável"}
            </Button>

            {hasActiveLink && (
              <Button
                type="button"
                variant="danger"
                onClick={handleRevokeShareLink}
                disabled={shareBusy}
                leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
              >
                Revogar
              </Button>
            )}

            <Button
              type="button"
              variant={showCreateForm ? "outline" : "primary"}
              onClick={() => setShowCreateForm((prev) => !prev)}
              leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              {showCreateForm ? "Cancelar" : "Novo projeto"}
            </Button>
          </div>
        </div>

        {shareError && <Alert variant="danger">{shareError}</Alert>}

        {shareUrl ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all font-mono text-xs font-medium text-[var(--ink-primary)] sm:text-sm">
              {shareUrl}
            </code>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={
                  copied ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )
                }
              >
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 sm:min-h-9 items-center gap-1 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-primary-hover)]"
              >
                <span>Abrir</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : hasActiveLink ? (
          <Alert variant="info">
            Link ativo
            {shareCreatedAt
              ? ` desde ${new Date(shareCreatedAt).toLocaleDateString("pt-BR")}`
              : ""}
            . Gere um novo link se precisar copiá-lo novamente (o anterior será
            revogado).
          </Alert>
        ) : null}
      </Card>

      {/* Formulário de Criação */}
      {showCreateForm && (
        <Card as="div">
          <form onSubmit={handleCreateProject} className="space-y-4">
            <h3 className="font-display text-base font-semibold text-[var(--ink-primary)]">
              Adicionar projeto ao portfólio
            </h3>

            {createError && <Alert variant="danger">{createError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="new-project-title"
                label="Título do projeto"
                required
              >
                <Input
                  type="text"
                  required
                  minLength={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: App de coleta seletiva no bairro"
                />
              </FormField>

              <FormField
                id="new-project-url"
                label="Link externo (opcional)"
              >
                <Input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
            </div>

            <FormField
              id="new-project-summary"
              label="Resumo curto (opcional)"
            >
              <Input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Se deixar em branco, será gerado a partir da reflexão."
              />
            </FormField>

            <FormField
              id="new-project-reflection"
              label="O que você construiu e aprendeu?"
              required
            >
              <Textarea
                required
                minLength={10}
                rows={3}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Conte o problema que resolveu, como testou sua ideia e o que aprendeu."
              />
            </FormField>

            <FileUploadField
              id="new-project-file"
              label="Evidência (opcional)"
              hint="PDF, PNG ou JPG até 5 MB."
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              file={file}
              onFileChange={setFile}
            />

            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-[var(--ink-secondary)]">
              <input
                type="checkbox"
                checked={isIncludedInShare}
                onChange={(e) => setIsIncludedInShare(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
              />
              <span>
                Incluir este projeto quando eu gerar um link compartilhável
              </span>
            </label>

            <div className="flex justify-end gap-2">
              <Button type="submit" variant="primary" loading={createBusy}>
                {createBusy ? "Salvando..." : "Salvar projeto"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {actionError && <Alert variant="danger">{actionError}</Alert>}

      {/* Lista de Projetos */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="Você ainda não tem projetos no portfólio."
          description="Crie um projeto acima ou complete um desafio na etapa Experimentar."
          action={
            <ButtonLink href="/app/experimentar" variant="outline" size="sm">
              Explorar desafios
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isEditing = editingId === project.id;

            return (
              <Card key={project.id} as="article" padding="sm" className="p-5">
                {isEditing ? (
                  <div className="space-y-4">
                    <FormField
                      id={`edit-project-title-${project.id}`}
                      label="Título do projeto"
                      required
                    >
                      <Input
                        type="text"
                        required
                        minLength={2}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título"
                      />
                    </FormField>

                    <FormField
                      id={`edit-project-summary-${project.id}`}
                      label="Resumo curto (opcional)"
                    >
                      <Input
                        type="text"
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        placeholder="Resumo"
                      />
                    </FormField>

                    <FormField
                      id={`edit-project-reflection-${project.id}`}
                      label="O que você construiu e aprendeu?"
                      required
                    >
                      <Textarea
                        rows={3}
                        required
                        minLength={10}
                        value={editReflection}
                        onChange={(e) => setEditReflection(e.target.value)}
                        placeholder="Reflexão"
                      />
                    </FormField>

                    <FormField
                      id={`edit-project-url-${project.id}`}
                      label="Link externo (opcional)"
                    >
                      <Input
                        type="url"
                        value={editExternalUrl}
                        onChange={(e) => setEditExternalUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </FormField>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveEdit(project.id)}
                        loading={editBusy}
                      >
                        {editBusy ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-[var(--ink-primary)]">
                            {project.title}
                          </h3>
                          {project.challengeTitle && (
                            <Badge variant="brand">
                              {project.challengeTitle}
                            </Badge>
                          )}
                        </div>
                        {project.summary &&
                        project.summary.trim() !== project.reflection.trim() ? (
                          <p className="text-sm font-medium text-[var(--ink-primary)]/85">
                            {project.summary}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleShare(project)}
                          className={`inline-flex min-h-11 sm:min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            project.isIncludedInShare
                              ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-ink)] hover:opacity-90"
                              : "border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] hover:bg-[var(--border-subtle)]/60"
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
                          className="inline-flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(project)}
                          aria-label={`Excluir ${project.title}`}
                          className="inline-flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--status-danger-border)] text-[var(--status-danger-ink)] transition-colors hover:bg-[var(--status-danger-bg)]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {project.reflection}
                    </p>

                    {(project.externalUrl || project.evidenceFiles.length > 0) && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-3">
                        {project.externalUrl && (
                          <a
                            href={project.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 sm:min-h-0 items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                          >
                            <ExternalLink
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            <span>Link externo</span>
                          </a>
                        )}

                        {project.evidenceFiles.map((evidence) => (
                          <a
                            key={evidence.id}
                            href={`/api/files/${evidence.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 sm:min-h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
                          >
                            <FileText
                              className="h-3.5 w-3.5 text-[var(--brand-primary)]"
                              aria-hidden="true"
                            />
                            <span>
                              {evidence.originalName} (
                              {formatFileSize(evidence.sizeBytes)})
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir projeto?"
        description={
          deleteTarget
            ? `Tem certeza que deseja excluir "${deleteTarget.title}" e seus arquivos anexados? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir projeto"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteBusy}
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
