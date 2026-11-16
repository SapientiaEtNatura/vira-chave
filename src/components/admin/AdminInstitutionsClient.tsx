"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  GraduationCap,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  Select,
} from "@/components/ui";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";

export interface AdminInstitutionItem {
  id: string;
  name: string;
  institutionCode: string;
  active: boolean;
  createdAt: string;
  userCount: number;
  classroomCount: number;
}

export interface AdminEducatorItem {
  id: string;
  name: string;
  email: string;
  status: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionActive: boolean | null;
  createdAt: string;
}

export interface AdminClassroomItem {
  id: string;
  name: string;
  inviteCode: string;
  active: boolean;
  createdAt: string;
  institution: {
    id: string;
    name: string;
    institutionCode: string;
    active: boolean;
  };
  educator: {
    id: string;
    name: string;
  };
  _count: {
    enrollments: number;
  };
}

type InstitutionsTab = "schools" | "classrooms";

interface PendingClassroomAction {
  type: "toggle" | "regenerate";
  classroom: AdminClassroomItem;
}

interface AdminInstitutionsClientProps {
  initialInstitutions: AdminInstitutionItem[];
  initialEducators: AdminEducatorItem[];
}

export function AdminInstitutionsClient({
  initialInstitutions,
  initialEducators,
}: AdminInstitutionsClientProps) {
  const [activeTab, setActiveTab] = useState<InstitutionsTab>("schools");
  const [tabDirection, setTabDirection] = useState<"right" | "left">("right");
  const {
    containerRef: tabListRef,
    setItemRef: setTabRef,
    indicator,
  } = useSlidingIndicator(activeTab);
  const [institutions, setInstitutions] =
    useState<AdminInstitutionItem[]>(initialInstitutions);
  const [educators, setEducators] =
    useState<AdminEducatorItem[]>(initialEducators);

  const [name, setName] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Estado da aba Turmas
  const [classrooms, setClassrooms] = useState<AdminClassroomItem[]>([]);
  const [classroomsLoaded, setClassroomsLoaded] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [classroomSearch, setClassroomSearch] = useState("");
  const [classroomInstitutionId, setClassroomInstitutionId] = useState("");
  const [pendingClassroomAction, setPendingClassroomAction] =
    useState<PendingClassroomAction | null>(null);
  const [updatingClassroom, setUpdatingClassroom] = useState(false);
  const classroomsFirstFilter = useRef(true);

  async function handleCreateInstitution(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setCreating(true);

    try {
      const response = await fetch("/api/admin/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          institutionCode: institutionCode.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as {
        institution?: AdminInstitutionItem;
        error?: string;
      };
      if (!response.ok || !payload.institution) {
        setError(payload.error ?? "Não foi possível criar a instituição.");
        return;
      }

      setInstitutions((prev) => [payload.institution!, ...prev]);
      setName("");
      setInstitutionCode("");
      setFeedback("Instituição parceira cadastrada com sucesso.");
    } catch {
      setError("Erro de conexão ao cadastrar instituição.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleInstitution(institution: AdminInstitutionItem) {
    setError(null);
    setFeedback(null);
    setTogglingId(institution.id);

    try {
      const response = await fetch("/api/admin/institutions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "institution",
          id: institution.id,
          active: !institution.active,
        }),
      });
      const payload = (await response.json()) as {
        institution?: AdminInstitutionItem;
        error?: string;
      };
      if (!response.ok || !payload.institution) {
        setError(payload.error ?? "Não foi possível atualizar a instituição.");
        return;
      }

      setInstitutions((prev) =>
        prev.map((item) =>
          item.id === institution.id ? payload.institution! : item,
        ),
      );
      setEducators((prev) =>
        prev.map((edu) =>
          edu.institutionId === institution.id
            ? { ...edu, institutionActive: payload.institution!.active }
            : edu,
        ),
      );
      setFeedback(
        payload.institution.active
          ? "Instituição reativada para novos cadastros."
          : "Instituição desativada para novos cadastros. Contas já vinculadas continuam funcionando.",
      );
    } catch {
      setError("Erro de conexão ao atualizar instituição.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleEducatorStatus(educator: AdminEducatorItem) {
    setError(null);
    setFeedback(null);
    setTogglingId(educator.id);
    const nextStatus = educator.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      const response = await fetch("/api/admin/institutions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "educator",
          id: educator.id,
          status: nextStatus,
        }),
      });
      const payload = (await response.json()) as {
        educator?: AdminEducatorItem;
        error?: string;
      };
      if (!response.ok || !payload.educator) {
        setError(payload.error ?? "Não foi possível atualizar o educador.");
        return;
      }

      setEducators((prev) =>
        prev.map((item) =>
          item.id === educator.id ? payload.educator! : item,
        ),
      );
      setFeedback(
        nextStatus === "ACTIVE"
          ? `Conta de ${educator.name} reativada.`
          : `Conta de ${educator.name} suspensa.`,
      );
    } catch {
      setError("Erro de conexão ao atualizar educador.");
    } finally {
      setTogglingId(null);
    }
  }

  async function fetchClassrooms(params: {
    q: string;
    institutionId: string;
  }) {
    setLoadingClassrooms(true);
    setError(null);

    try {
      const sp = new URLSearchParams();
      if (params.q.trim()) sp.set("q", params.q.trim());
      if (params.institutionId) sp.set("institutionId", params.institutionId);

      const query = sp.toString();
      const response = await fetch(
        `/api/admin/classrooms${query ? `?${query}` : ""}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        classrooms?: AdminClassroomItem[];
        error?: string;
      };

      if (!response.ok || !payload.classrooms) {
        setError(payload.error ?? "Não foi possível carregar as turmas.");
        return;
      }

      setClassrooms(payload.classrooms);
      setClassroomsLoaded(true);
    } catch {
      setError("Erro de conexão ao carregar turmas.");
    } finally {
      setLoadingClassrooms(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "classrooms") return;
    if (!classroomsLoaded) {
      void fetchClassrooms({
        q: classroomSearch,
        institutionId: classroomInstitutionId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "classrooms") return;
    if (classroomsFirstFilter.current) {
      classroomsFirstFilter.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void fetchClassrooms({
        q: classroomSearch,
        institutionId: classroomInstitutionId,
      });
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomSearch, classroomInstitutionId]);

  async function handleConfirmClassroomAction() {
    if (!pendingClassroomAction) return;
    setError(null);
    setFeedback(null);
    setUpdatingClassroom(true);

    const { type, classroom } = pendingClassroomAction;
    const body =
      type === "toggle"
        ? { classroomId: classroom.id, active: !classroom.active }
        : { classroomId: classroom.id, regenerateCode: true };

    try {
      const response = await fetch("/api/admin/classrooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        classroom?: AdminClassroomItem;
        error?: string;
      };

      if (!response.ok || !payload.classroom) {
        setError(payload.error ?? "Não foi possível atualizar a turma.");
        setPendingClassroomAction(null);
        return;
      }

      setClassrooms((prev) =>
        prev.map((item) =>
          item.id === payload.classroom!.id ? payload.classroom! : item,
        ),
      );
      setFeedback(
        type === "toggle"
          ? payload.classroom.active
            ? `Turma "${payload.classroom.name}" ativada.`
            : `Turma "${payload.classroom.name}" desativada.`
          : `Novo código de convite gerado para "${payload.classroom.name}": ${payload.classroom.inviteCode}.`,
      );
      setPendingClassroomAction(null);
    } catch {
      setError("Erro de conexão ao atualizar a turma.");
      setPendingClassroomAction(null);
    } finally {
      setUpdatingClassroom(false);
    }
  }

  async function handleCopyCode(institution: AdminInstitutionItem) {
    try {
      await navigator.clipboard.writeText(institution.institutionCode);
      setCopiedId(institution.id);
      setTimeout(() => {
        setCopiedId((current) => (current === institution.id ? null : current));
      }, 2000);
    } catch {
      setError("Não foi possível copiar o código automaticamente.");
    }
  }

  return (
    <div className="space-y-6">
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Gestão institucional"
        className="relative inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-[var(--brand-primary)] shadow-xs transition-[transform,width,height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: indicator.width,
            height: indicator.height,
            transform: `translate3d(${indicator.x}px, ${indicator.y}px, 0)`,
            opacity: indicator.ready ? 1 : 0,
          }}
        />
        <button
          ref={setTabRef("schools")}
          id="tab-schools"
          role="tab"
          type="button"
          aria-selected={activeTab === "schools"}
          aria-controls="panel-schools"
          onClick={() => {
            setTabDirection(activeTab === "schools" ? "right" : "left");
            setError(null);
            setFeedback(null);
            setActiveTab("schools");
          }}
          className={`relative z-10 inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer ${
            activeTab === "schools"
              ? "text-white"
              : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface)]/70 hover:text-[var(--ink-primary)]"
          }`}
        >
          <Building2 className="h-4 w-4" aria-hidden="true" />
          <span>Escolas</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors duration-200 ${
              activeTab === "schools"
                ? "bg-white/20 text-white"
                : "bg-[var(--bg-surface-subtle)] text-[var(--ink-muted)]"
            }`}
          >
            {institutions.length}
          </span>
        </button>

        <button
          ref={setTabRef("classrooms")}
          id="tab-classrooms"
          role="tab"
          type="button"
          aria-selected={activeTab === "classrooms"}
          aria-controls="panel-classrooms"
          onClick={() => {
            setTabDirection("right");
            setError(null);
            setFeedback(null);
            setActiveTab("classrooms");
          }}
          className={`relative z-10 inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer ${
            activeTab === "classrooms"
              ? "text-white"
              : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface)]/70 hover:text-[var(--ink-primary)]"
          }`}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>Turmas</span>
          {classroomsLoaded ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors duration-200 ${
                activeTab === "classrooms"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--bg-surface-subtle)] text-[var(--ink-muted)]"
              }`}
            >
              {classrooms.length}
            </span>
          ) : null}
        </button>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <div
        key={activeTab}
        className={
          tabDirection === "right" ? "animate-tab-right" : "animate-tab-left"
        }
      >
      {activeTab === "schools" && (
        <div
          id="panel-schools"
          role="tabpanel"
          aria-labelledby="tab-schools"
          className="space-y-8"
        >

      <Card as="section" padding="md" className="rounded-2xl">
        <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
          Nova instituição parceira
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          O código institucional permite que educadores dessa escola se
          cadastrem na plataforma. Se omitido, um código único será gerado
          automaticamente.
        </p>

        <form
          onSubmit={handleCreateInstitution}
          className="mt-4 grid gap-4 sm:grid-cols-3 sm:items-end"
        >
          <FormField
            id="institution-name"
            label="Nome da escola ou instituição"
            required
          >
            <Input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: E.E. Machado de Assis"
            />
          </FormField>

          <FormField
            id="institution-code"
            label="Código institucional (opcional)"
          >
            <Input
              type="text"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
              placeholder="Ex: INST-MACHADO"
              className="font-mono uppercase"
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            loading={creating}
            leftIcon={<Plus className="h-4 w-4" />}
            className="min-h-11"
          >
            {creating ? "Cadastrando..." : "Cadastrar instituição"}
          </Button>
        </form>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2
            className="h-5 w-5 text-[var(--brand-primary)]"
            aria-hidden="true"
          />
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            Instituições parceiras ({institutions.length})
          </h2>
        </div>

        {institutions.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="Nenhuma instituição cadastrada"
            description="Cadastre a primeira instituição parceira acima para gerar o código institucional."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {institutions.map((institution) => (
              <Card
                key={institution.id}
                as="article"
                padding="md"
                className="flex flex-col justify-between gap-4 rounded-2xl"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
                      {institution.name}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                        institution.active
                          ? "text-[var(--status-success-ink)]"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          institution.active
                            ? "bg-emerald-500"
                            : "bg-[var(--ink-muted)]"
                        }`}
                        aria-hidden="true"
                      />
                      {institution.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[var(--bg-surface-subtle)] px-2.5 py-1.5 font-mono text-xs font-semibold text-[var(--ink-primary)]">
                      {institution.institutionCode}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(institution)}
                      leftIcon={
                        copiedId === institution.id ? (
                          <Check className="h-3.5 w-3.5 text-[var(--status-success-ink)]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )
                      }
                    >
                      {copiedId === institution.id ? "Copiado" : "Copiar código"}
                    </Button>
                  </div>

                  <p className="text-xs text-[var(--ink-muted)]">
                    {institution.userCount} usuários vinculados ·{" "}
                    {institution.classroomCount} turmas
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-xs text-[var(--ink-muted)]">
                    {institution.active
                      ? "Aceita novos educadores"
                      : "Bloqueada para novos cadastros"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={togglingId === institution.id}
                    loading={togglingId === institution.id}
                    onClick={() => handleToggleInstitution(institution)}
                    leftIcon={<Power className="h-3.5 w-3.5" />}
                  >
                    {institution.active ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap
            className="h-5 w-5 text-[var(--brand-primary)]"
            aria-hidden="true"
          />
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            Educadores vinculados ({educators.length})
          </h2>
        </div>

        {educators.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-6 w-6" />}
            title="Nenhum educador cadastrado"
            description="Os educadores aparecerão aqui assim que se cadastrarem usando um código institucional."
          />
        ) : (
          <Card padding="sm" className="overflow-hidden rounded-2xl p-0 sm:p-0">
            <div className="divide-y divide-[var(--border-subtle)]">
              {educators.map((educator) => {
                const isActive = educator.status === "ACTIVE";
                return (
                  <div
                    key={educator.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[var(--ink-primary)]">
                          {educator.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            isActive
                              ? "text-[var(--status-success-ink)]"
                              : "text-[var(--status-danger-ink)]"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                            aria-hidden="true"
                          />
                          {isActive ? "Ativo" : "Suspenso"}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-secondary)]">
                        {educator.email}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Instituição:{" "}
                        <span className="font-medium text-[var(--ink-secondary)]">
                          {educator.institutionName ?? "Sem vínculo"}
                        </span>
                        {educator.institutionActive === false ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-[var(--status-warning-ink)]">
                            <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                            Instituição inativa (conta mantida)
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={isActive ? "danger" : "secondary"}
                      size="sm"
                      disabled={togglingId === educator.id}
                      loading={togglingId === educator.id}
                      onClick={() => handleToggleEducatorStatus(educator)}
                      leftIcon={<Power className="h-3.5 w-3.5" />}
                    >
                      {isActive ? "Suspender" : "Reativar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>
        </div>
      )}

      {activeTab === "classrooms" && (
        <div
          id="panel-classrooms"
          role="tabpanel"
          aria-labelledby="tab-classrooms"
          className="space-y-6"
        >
          <Card as="section" padding="md" className="rounded-2xl">
            <div className="grid gap-4 md:grid-cols-3 md:items-end">
              <FormField
                id="classrooms-search"
                label="Buscar turma ou código"
                className="md:col-span-2"
              >
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  <Input
                    id="classrooms-search"
                    type="search"
                    value={classroomSearch}
                    onChange={(e) => setClassroomSearch(e.target.value)}
                    placeholder="Nome da turma ou código (ex: TURMA-...)"
                    className="pl-9"
                  />
                </div>
              </FormField>

              <FormField id="classrooms-institution-filter" label="Escola">
                <Select
                  value={classroomInstitutionId}
                  onChange={(e) => setClassroomInstitutionId(e.target.value)}
                >
                  <option value="">Todas as escolas</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--ink-muted)]">
              <span className="tabular-nums">
                {loadingClassrooms
                  ? "Carregando turmas..."
                  : `${classrooms.length} ${classrooms.length === 1 ? "turma encontrada" : "turmas encontradas"}`}
              </span>
            </div>
          </Card>

          {loadingClassrooms && !classroomsLoaded ? (
            <Card padding="md">
              <p className="text-sm text-[var(--ink-secondary)]">
                Carregando turmas cadastradas...
              </p>
            </Card>
          ) : classrooms.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="Nenhuma turma encontrada"
              description="Não há turmas cadastradas para os filtros selecionados."
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
                          Turma
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Escola
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Educador
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Código
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Alunos
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
                      {classrooms.map((classroom) => (
                        <tr
                          key={classroom.id}
                          className="transition-colors hover:bg-[var(--bg-canvas)]/60"
                        >
                          <td className="px-4 py-3 font-medium text-[var(--ink-primary)]">
                            {classroom.name}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-secondary)]">
                            {classroom.institution.name}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-secondary)]">
                            {classroom.educator.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-[var(--bg-surface-subtle)] px-2 py-1 font-mono text-xs font-semibold text-[var(--ink-primary)]">
                              {classroom.inviteCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[var(--ink-primary)] tabular-nums">
                            {classroom._count.enrollments}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                classroom.active
                                  ? "text-[var(--status-success-ink)]"
                                  : "text-[var(--ink-muted)]"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  classroom.active
                                    ? "bg-emerald-500"
                                    : "bg-[var(--ink-muted)]"
                                }`}
                                aria-hidden="true"
                              />
                              {classroom.active ? "Ativa" : "Inativa"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPendingClassroomAction({
                                    type: "regenerate",
                                    classroom,
                                  })
                                }
                                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                              >
                                Gerar novo código
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  classroom.active ? "danger" : "secondary"
                                }
                                size="sm"
                                onClick={() =>
                                  setPendingClassroomAction({
                                    type: "toggle",
                                    classroom,
                                  })
                                }
                                leftIcon={<Power className="h-3.5 w-3.5" />}
                              >
                                {classroom.active ? "Desativar" : "Ativar"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Cards Mobile (< md) */}
              <div className="space-y-3 md:hidden">
                {classrooms.map((classroom) => (
                  <Card key={classroom.id} padding="md" className="space-y-3 rounded-2xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[var(--ink-primary)]">
                          {classroom.name}
                        </h3>
                        <p className="truncate text-xs text-[var(--ink-secondary)]">
                          {classroom.institution.name} ·{" "}
                          {classroom.educator.name}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                          classroom.active
                            ? "text-[var(--status-success-ink)]"
                            : "text-[var(--ink-muted)]"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            classroom.active
                              ? "bg-emerald-500"
                              : "bg-[var(--ink-muted)]"
                          }`}
                          aria-hidden="true"
                        />
                        {classroom.active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="rounded bg-[var(--bg-surface-subtle)] px-2 py-1 font-mono font-semibold text-[var(--ink-primary)]">
                        {classroom.inviteCode}
                      </span>
                      <span className="text-[var(--ink-secondary)] tabular-nums">
                        {classroom._count.enrollments}{" "}
                        {classroom._count.enrollments === 1
                          ? "aluno"
                          : "alunos"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          setPendingClassroomAction({
                            type: "regenerate",
                            classroom,
                          })
                        }
                        leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Novo código
                      </Button>
                      <Button
                        type="button"
                        variant={classroom.active ? "danger" : "secondary"}
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          setPendingClassroomAction({
                            type: "toggle",
                            classroom,
                          })
                        }
                        leftIcon={<Power className="h-3.5 w-3.5" />}
                      >
                        {classroom.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      </div>

      <ConfirmDialog
        open={pendingClassroomAction !== null}
        title={
          pendingClassroomAction?.type === "regenerate"
            ? "Gerar novo código de convite"
            : pendingClassroomAction?.classroom.active
              ? "Desativar turma"
              : "Ativar turma"
        }
        description={
          pendingClassroomAction?.type === "regenerate"
            ? `O código atual (${pendingClassroomAction.classroom.inviteCode}) deixará de funcionar para novas entradas na turma "${pendingClassroomAction.classroom.name}".`
            : pendingClassroomAction?.classroom.active
              ? `Deseja desativar a turma "${pendingClassroomAction.classroom.name}"? Novos estudantes não poderão entrar pelo código de convite.`
              : `Deseja reativar a turma "${pendingClassroomAction?.classroom.name ?? ""}"?`
        }
        confirmLabel={
          pendingClassroomAction?.type === "regenerate"
            ? "Gerar novo código"
            : pendingClassroomAction?.classroom.active
              ? "Desativar"
              : "Ativar"
        }
        variant={
          pendingClassroomAction?.type === "toggle" &&
          pendingClassroomAction.classroom.active
            ? "danger"
            : "default"
        }
        loading={updatingClassroom}
        onConfirm={() => void handleConfirmClassroomAction()}
        onCancel={() => {
          if (!updatingClassroom) setPendingClassroomAction(null);
        }}
      />
    </div>
  );
}
