"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Search,
  X,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Select,
  type BadgeVariant,
} from "@/components/ui";

export interface AdminAuditLogItem {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface AdminAuditPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AdminAuditClientProps {
  initialLogs: AdminAuditLogItem[];
  initialPagination: AdminAuditPagination;
}

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "USER_UPDATED", label: "Usuário atualizado" },
  { value: "INSTITUTION_CREATED", label: "Instituição criada" },
  { value: "INSTITUTION_UPDATED", label: "Instituição atualizada" },
  { value: "CLASSROOM_UPDATED", label: "Turma atualizada" },
  { value: "CONTENT_CREATED", label: "Conteúdo criado" },
  { value: "CONTENT_UPDATED", label: "Conteúdo atualizado" },
  { value: "CONTENT_DELETED", label: "Conteúdo excluído" },
  { value: "LINKS_CHECKED", label: "Verificação de links" },
  { value: "ACCOUNT_DELETED", label: "Conta excluída" },
  { value: "AUTH_LOGIN_FAILED", label: "Falha de login" },
];

const ACTION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  USER_UPDATED: { label: "Usuário atualizado", variant: "warning" },
  INSTITUTION_CREATED: { label: "Instituição criada", variant: "success" },
  INSTITUTION_UPDATED: { label: "Instituição atualizada", variant: "warning" },
  CLASSROOM_UPDATED: { label: "Turma atualizada", variant: "warning" },
  CONTENT_CREATED: { label: "Conteúdo criado", variant: "success" },
  CONTENT_UPDATED: { label: "Conteúdo atualizado", variant: "warning" },
  CONTENT_DELETED: { label: "Conteúdo excluído", variant: "danger" },
  LINKS_CHECKED: { label: "Verificação de links", variant: "brand" },
  ACCOUNT_DELETED: { label: "Conta excluída", variant: "danger" },
  AUTH_LOGIN_FAILED: { label: "Falha de login", variant: "danger" },
};

const ACTION_DOT_CLASS: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  brand: "bg-[var(--brand-primary)]",
  neutral: "bg-[var(--ink-muted)]",
};

function getActionBadge(action: string): {
  label: string;
  variant: BadgeVariant;
} {
  return ACTION_META[action] ?? { label: action, variant: "neutral" };
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export function AdminAuditClient({
  initialLogs,
  initialPagination,
}: AdminAuditClientProps) {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>(initialLogs);
  const [pagination, setPagination] =
    useState<AdminAuditPagination>(initialPagination);

  const [actionFilter, setActionFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedLog) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedLog(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (prevFocused && typeof prevFocused.focus === "function") {
        prevFocused.focus();
      }
    };
  }, [selectedLog]);

  async function fetchLogs(params: {
    action: string;
    q: string;
    page: number;
  }) {
    setLoading(true);
    setError(null);

    try {
      const sp = new URLSearchParams();
      if (params.action) sp.set("action", params.action);
      if (params.q.trim()) sp.set("q", params.q.trim());
      sp.set("page", String(params.page));
      sp.set("pageSize", String(pagination.pageSize));

      const response = await fetch(`/api/admin/audit?${sp.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        logs?: AdminAuditLogItem[];
        pagination?: AdminAuditPagination;
        error?: string;
      };

      if (!response.ok || !payload.logs || !payload.pagination) {
        setError(
          payload.error ?? "Não foi possível carregar os registros de auditoria.",
        );
        return;
      }

      setLogs(payload.logs);
      setPagination(payload.pagination);
    } catch {
      setError("Erro de conexão ao consultar auditoria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void fetchLogs({
        action: actionFilter,
        q: searchInput,
        page: 1,
      });
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, searchInput]);

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > pagination.totalPages || loading) return;
    void fetchLogs({
      action: actionFilter,
      q: searchInput,
      page: nextPage,
    });
  }

  return (
    <div className="space-y-6">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card as="section" padding="md" className="rounded-2xl">
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <FormField
            id="audit-search"
            label="Buscar por ator, alvo ou ação"
            className="md:col-span-2"
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
                aria-hidden="true"
              />
              <Input
                id="audit-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nome do ator, tipo ou ID do alvo..."
                className="pl-9"
              />
            </div>
          </FormField>

          <FormField id="audit-action-filter" label="Tipo de ação">
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">Todas as ações</option>
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--ink-muted)]">
          <span className="tabular-nums">
            {loading
              ? "Atualizando registros..."
              : `${pagination.total} ${pagination.total === 1 ? "registro encontrado" : "registros encontrados"}`}
          </span>
          <span className="tabular-nums">
            Página {pagination.page} de {pagination.totalPages}
          </span>
        </div>
      </Card>

      {logs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Nenhum registro de auditoria"
          description="Ainda não há eventos registrados para os filtros selecionados."
        />
      ) : (
        <>
          {/* Tabela Desktop (md+) */}
          <Card
            padding="sm"
            className="hidden overflow-hidden rounded-2xl p-0 md:block sm:p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 text-xs font-semibold text-[var(--ink-secondary)]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Data / Hora
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Ator
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Ação
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Alvo
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {logs.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-[var(--bg-canvas)]/60"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--ink-secondary)] tabular-nums">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-[var(--ink-primary)]">
                            {log.actor?.name ?? "Sistema"}
                          </div>
                          {log.actorRole ? (
                            <div className="text-xs text-[var(--ink-muted)]">
                              {log.actorRole}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={badge.variant}>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${ACTION_DOT_CLASS[badge.variant]}`}
                              aria-hidden="true"
                            />
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--ink-secondary)]">
                          <span className="font-semibold text-[var(--ink-primary)]">
                            {log.targetType}
                          </span>
                          {log.targetId ? (
                            <span className="ml-1.5 font-mono text-[var(--ink-muted)]">
                              {log.targetId}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cards Mobile (< md) */}
          <div className="space-y-3 md:hidden">
            {logs.map((log) => {
              const badge = getActionBadge(log.action);
              return (
                <Card key={log.id} padding="md" className="space-y-3 rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={badge.variant}>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${ACTION_DOT_CLASS[badge.variant]}`}
                        aria-hidden="true"
                      />
                      {badge.label}
                    </Badge>
                    <span className="text-xs text-[var(--ink-muted)] tabular-nums">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-[var(--ink-secondary)]">
                      Ator:{" "}
                      <strong className="font-semibold text-[var(--ink-primary)]">
                        {log.actor?.name ?? "Sistema"}
                      </strong>
                      {log.actorRole ? ` (${log.actorRole})` : ""}
                    </p>
                    <p className="text-[var(--ink-secondary)]">
                      Alvo:{" "}
                      <strong className="font-semibold text-[var(--ink-primary)]">
                        {log.targetType}
                      </strong>
                      {log.targetId ? (
                        <span className="ml-1.5 break-all font-mono text-[var(--ink-muted)]">
                          {log.targetId}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="border-t border-[var(--border-subtle)] pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedLog(log)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Detalhes
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Anterior
              </Button>
              <span className="text-xs font-medium text-[var(--ink-secondary)] tabular-nums">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Próxima
              </Button>
            </div>
          ) : null}
        </>
      )}

      {/* Modal de detalhes do log (sob demanda) */}
      {mounted && selectedLog
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink-primary)]/50 p-4 backdrop-blur-xs"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedLog(null);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="audit-detail-title"
                className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2
                      id="audit-detail-title"
                      className="font-display text-lg font-bold text-[var(--ink-primary)]"
                    >
                      Detalhes do registro
                    </h2>
                    <p className="text-xs text-[var(--ink-muted)] tabular-nums">
                      {formatDateTime(selectedLog.createdAt)} ·{" "}
                      {selectedLog.action}
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="Fechar detalhes"
                    onClick={() => setSelectedLog(null)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--ink-muted)] transition-colors hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)] cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 text-xs">
                  <div>
                    <dt className="text-[var(--ink-muted)]">Ator</dt>
                    <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">
                      {selectedLog.actor?.name ?? "Sistema"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">Papel do ator</dt>
                    <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">
                      {selectedLog.actorRole ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">Tipo de alvo</dt>
                    <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">
                      {selectedLog.targetType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">ID do alvo</dt>
                    <dd className="mt-0.5 break-all font-mono text-[var(--ink-primary)]">
                      {selectedLog.targetId ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                    Metadados (JSON)
                  </p>
                  <pre className="max-h-72 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 font-mono text-xs text-[var(--ink-primary)]">
                    {selectedLog.metadata !== null &&
                    selectedLog.metadata !== undefined
                      ? JSON.stringify(selectedLog.metadata, null, 2)
                      : "Sem metadados adicionais."}
                  </pre>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedLog(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
