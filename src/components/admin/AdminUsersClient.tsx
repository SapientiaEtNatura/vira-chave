"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Power,
  Search,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  Select,
  type BadgeVariant,
} from "@/components/ui";

export type UserRoleValue = "ESTUDANTE" | "EDUCADOR" | "ADMIN";
export type UserStatusValue = "ACTIVE" | "SUSPENDED";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  status: UserStatusValue;
  institutionId: string | null;
  createdAt: string;
  updatedAt: string;
  institution: {
    id: string;
    name: string;
    institutionCode: string;
    active: boolean;
  } | null;
}

export interface AdminUsersPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ActiveInstitutionOption {
  id: string;
  name: string;
  institutionCode: string;
}

interface AdminUsersClientProps {
  currentUserId: string;
  initialUsers: AdminUserItem[];
  initialPagination: AdminUsersPagination;
  activeInstitutions: ActiveInstitutionOption[];
}

const ROLE_LABELS: Record<UserRoleValue, string> = {
  ESTUDANTE: "Estudante",
  EDUCADOR: "Educador",
  ADMIN: "Administrador",
};

const ROLE_BADGE_VARIANT: Record<UserRoleValue, BadgeVariant> = {
  ESTUDANTE: "neutral",
  EDUCADOR: "brand",
  ADMIN: "warning",
};

function getInitials(name: string): string {
  const source = name.trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AdminUsersClient({
  currentUserId,
  initialUsers,
  initialPagination,
  activeInstitutions,
}: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [pagination, setPagination] =
    useState<AdminUsersPagination>(initialPagination);

  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | UserRoleValue>("");
  const [statusFilter, setStatusFilter] = useState<"" | UserStatusValue>("");
  const [loadingList, setLoadingList] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edição (papel e instituição)
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editRole, setEditRole] = useState<UserRoleValue>("ESTUDANTE");
  const [editInstitutionId, setEditInstitutionId] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Suspender / Ativar
  const [pendingStatusUser, setPendingStatusUser] =
    useState<AdminUserItem | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const isFirstRender = useRef(true);

  async function fetchUsers(params: {
    q: string;
    role: "" | UserRoleValue;
    status: "" | UserStatusValue;
    page: number;
  }) {
    setLoadingList(true);
    setError(null);

    try {
      const sp = new URLSearchParams();
      if (params.q.trim()) sp.set("q", params.q.trim());
      if (params.role) sp.set("role", params.role);
      if (params.status) sp.set("status", params.status);
      sp.set("page", String(params.page));
      sp.set("pageSize", String(pagination.pageSize));

      const response = await fetch(`/api/admin/users?${sp.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        users?: AdminUserItem[];
        pagination?: AdminUsersPagination;
        error?: string;
      };

      if (!response.ok || !payload.users || !payload.pagination) {
        setError(payload.error ?? "Não foi possível carregar os usuários.");
        return;
      }

      setUsers(payload.users);
      setPagination(payload.pagination);
    } catch {
      setError("Erro de conexão ao buscar usuários.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void fetchUsers({
        q: searchInput,
        role: roleFilter,
        status: statusFilter,
        page: 1,
      });
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, roleFilter, statusFilter]);

  function openEditModal(user: AdminUserItem) {
    setError(null);
    setEditError(null);
    setFeedback(null);
    setEditingUser(user);
    setEditRole(user.role);
    setEditInstitutionId(user.institutionId ?? "");
  }

  async function handleConfirmEdit() {
    if (!editingUser) return;
    setError(null);
    setEditError(null);
    setFeedback(null);
    setSavingEdit(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editRole,
          institutionId: editInstitutionId || null,
        }),
      });

      const payload = (await response.json()) as {
        user?: AdminUserItem;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        setEditError(payload.error ?? "Não foi possível atualizar o usuário.");
        return;
      }

      setUsers((prev) =>
        prev.map((item) => (item.id === payload.user!.id ? payload.user! : item)),
      );
      setFeedback(`Cadastro de ${payload.user.name} atualizado com sucesso.`);
      setEditingUser(null);
    } catch {
      setEditError("Erro de conexão ao atualizar usuário. Tente novamente.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleConfirmStatusToggle() {
    if (!pendingStatusUser) return;
    setError(null);
    setFeedback(null);
    setTogglingStatus(true);

    const nextStatus: UserStatusValue =
      pendingStatusUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pendingStatusUser.id,
          status: nextStatus,
        }),
      });

      const payload = (await response.json()) as {
        user?: AdminUserItem;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        setError(
          payload.error ?? "Não foi possível alterar o status do usuário.",
        );
        setPendingStatusUser(null);
        return;
      }

      setUsers((prev) =>
        prev.map((item) => (item.id === payload.user!.id ? payload.user! : item)),
      );
      setFeedback(
        nextStatus === "ACTIVE"
          ? `Conta de ${payload.user.name} reativada.`
          : `Conta de ${payload.user.name} suspensa.`,
      );
      setPendingStatusUser(null);
    } catch {
      setError("Erro de conexão ao alterar status do usuário.");
      setPendingStatusUser(null);
    } finally {
      setTogglingStatus(false);
    }
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > pagination.totalPages || loadingList) {
      return;
    }
    void fetchUsers({
      q: searchInput,
      role: roleFilter,
      status: statusFilter,
      page: nextPage,
    });
  }

  const activeInPage = users.filter((u) => u.status === "ACTIVE").length;
  const suspendedInPage = users.length - activeInPage;

  return (
    <div className="space-y-6">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-[var(--ink-primary)] tabular-nums">
            {loadingList
              ? "Atualizando..."
              : `${pagination.total} ${pagination.total === 1 ? "usuário" : "usuários"}`}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] tabular-nums">
            <span
              className="h-2 w-2 rounded-full bg-[var(--status-success-solid)]"
              aria-hidden="true"
            />
            {activeInPage} {activeInPage === 1 ? "ativo" : "ativos"} nesta página
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] tabular-nums">
            <span
              className="h-2 w-2 rounded-full bg-[var(--status-danger-solid)]"
              aria-hidden="true"
            />
            {suspendedInPage}{" "}
            {suspendedInPage === 1 ? "suspenso" : "suspensos"} nesta página
          </span>
        </div>
        <span className="text-[var(--ink-muted)] tabular-nums">
          Página {pagination.page} de {pagination.totalPages}
        </span>
      </div>

      <Card as="section" padding="md" className="rounded-2xl">
        <div className="grid gap-4 md:grid-cols-4 md:items-end">
          <FormField
            id="users-search"
            label="Buscar usuário"
            className="md:col-span-2"
          >
            {(controlProps) => (
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
                  aria-hidden="true"
                />
                <Input
                  {...controlProps}
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nome ou e-mail..."
                  className="pl-9"
                />
              </div>
            )}
          </FormField>

          <FormField id="users-role-filter" label="Papel">
            <Select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "" | UserRoleValue)
              }
            >
              <option value="">Todos os papéis</option>
              <option value="ESTUDANTE">Estudante</option>
              <option value="EDUCADOR">Educador</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </FormField>

          <FormField id="users-status-filter" label="Status">
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "" | UserStatusValue)
              }
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="SUSPENDED">Suspenso</option>
            </Select>
          </FormField>
        </div>
      </Card>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Nenhum usuário encontrado"
          description="Ajuste os termos da busca ou limpe os filtros aplicados para visualizar outras contas."
          action={
            searchInput.trim() || roleFilter || statusFilter ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
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
                      Nome
                    </th>
                    <th scope="col" className="px-4 py-3">
                      E-mail
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Papel
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Instituição
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {users.map((user) => {
                    const isActive = user.status === "ACTIVE";
                    const isSelf = user.id === currentUserId;
                    const initials = getInitials(user.name);
                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-[var(--bg-canvas)]/60"
                      >
                        <td className="px-4 py-3 font-medium text-[var(--ink-primary)]">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-xs font-semibold text-[var(--brand-primary)]"
                              aria-hidden="true"
                            >
                              {initials}
                            </span>
                            <span className="truncate">
                              {user.name}
                              {isSelf ? (
                                <span className="ml-2 text-xs font-normal text-[var(--ink-muted)]">
                                  (você)
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--ink-secondary)]">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--ink-secondary)]">
                          {user.institution ? user.institution.name : "Sem vínculo"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isActive
                                ? "text-[var(--status-success-ink)]"
                                : "text-[var(--status-danger-ink)]"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive
                                  ? "bg-[var(--status-success-solid)]"
                                  : "bg-[var(--status-danger-solid)]"
                              }`}
                              aria-hidden="true"
                            />
                            {isActive ? "Ativo" : "Suspenso"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              leftIcon={<Pencil className="h-3.5 w-3.5" />}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant={isActive ? "danger" : "secondary"}
                              size="sm"
                              disabled={isSelf}
                              onClick={() => setPendingStatusUser(user)}
                              leftIcon={<Power className="h-3.5 w-3.5" />}
                            >
                              {isActive ? "Suspender" : "Reativar"}
                            </Button>
                          </div>
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
            {users.map((user) => {
              const isActive = user.status === "ACTIVE";
              const isSelf = user.id === currentUserId;
              const initials = getInitials(user.name);
              return (
                <Card key={user.id} padding="md" className="space-y-3 rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-xs font-semibold text-[var(--brand-primary)]"
                        aria-hidden="true"
                      >
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[var(--ink-primary)]">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-1.5 text-xs font-normal text-[var(--ink-muted)]">
                              (você)
                            </span>
                          ) : null}
                        </h3>
                        <p className="truncate text-xs text-[var(--ink-secondary)]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                        isActive
                          ? "text-[var(--status-success-ink)]"
                          : "text-[var(--status-danger-ink)]"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive
                            ? "bg-[var(--status-success-solid)]"
                            : "bg-[var(--status-danger-solid)]"
                        }`}
                        aria-hidden="true"
                      />
                      {isActive ? "Ativo" : "Suspenso"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)]">
                    <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <span>
                      Instituição:{" "}
                      <strong className="font-medium text-[var(--ink-primary)]">
                        {user.institution
                          ? user.institution.name
                          : "Sem vínculo"}
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(user)}
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant={isActive ? "danger" : "secondary"}
                      size="sm"
                      className="flex-1"
                      disabled={isSelf}
                      onClick={() => setPendingStatusUser(user)}
                      leftIcon={<Power className="h-3.5 w-3.5" />}
                    >
                      {isActive ? "Suspender" : "Ativar"}
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
                disabled={pagination.page <= 1 || loadingList}
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
                disabled={
                  pagination.page >= pagination.totalPages || loadingList
                }
                onClick={() => handlePageChange(pagination.page + 1)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Próxima
              </Button>
            </div>
          ) : null}
        </>
      )}

      {/* Modal de edição (Papel e Instituição) */}
      <ConfirmDialog
        open={editingUser !== null}
        title={
          editingUser ? `Editar usuário: ${editingUser.name}` : "Editar usuário"
        }
        description="Ajuste o papel de acesso ou o vínculo institucional desta conta."
        confirmLabel={savingEdit ? "Salvando..." : "Salvar alterações"}
        loading={savingEdit}
        onConfirm={() => void handleConfirmEdit()}
        onCancel={() => {
          if (!savingEdit) {
            setEditError(null);
            setEditingUser(null);
          }
        }}
      >
        <div className="space-y-4">
          {editError ? <Alert variant="danger">{editError}</Alert> : null}
          <FormField
            id="edit-user-role"
            label="Papel na plataforma"
            required
            hint={
              editingUser?.id === currentUserId
                ? "Você não pode rebaixar o seu próprio perfil de administrador."
                : undefined
            }
          >
            <Select
              value={editRole}
              disabled={editingUser?.id === currentUserId}
              onChange={(e) => setEditRole(e.target.value as UserRoleValue)}
            >
              <option value="ESTUDANTE">Estudante</option>
              <option value="EDUCADOR">Educador</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </FormField>

          <FormField id="edit-user-institution" label="Instituição vinculada">
            <Select
              value={editInstitutionId}
              onChange={(e) => setEditInstitutionId(e.target.value)}
            >
              <option value="">Sem vínculo institucional</option>
              {editingUser?.institution &&
              !activeInstitutions.some(
                (inst) => inst.id === editingUser.institution!.id,
              ) ? (
                <option value={editingUser.institution.id}>
                  {editingUser.institution.name} (inativa)
                </option>
              ) : null}
              {activeInstitutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.institutionCode})
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </ConfirmDialog>

      {/* Confirmação de Suspensão / Reativação */}
      <ConfirmDialog
        open={pendingStatusUser !== null}
        title={
          pendingStatusUser?.status === "ACTIVE"
            ? "Suspender conta de usuário"
            : "Reativar conta de usuário"
        }
        description={
          pendingStatusUser?.status === "ACTIVE"
            ? `Tem certeza que deseja suspender "${pendingStatusUser.name}"? A conta perderá acesso à plataforma até ser reativada.`
            : `Deseja reativar a conta de "${pendingStatusUser?.name ?? ""}"?`
        }
        confirmLabel={
          pendingStatusUser?.status === "ACTIVE"
            ? "Suspender"
            : "Reativar conta"
        }
        variant={pendingStatusUser?.status === "ACTIVE" ? "danger" : "default"}
        loading={togglingStatus}
        onConfirm={() => void handleConfirmStatusToggle()}
        onCancel={() => {
          if (!togglingStatus) setPendingStatusUser(null);
        }}
      />
    </div>
  );
}
