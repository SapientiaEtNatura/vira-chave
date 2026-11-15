"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  Copy,
  GraduationCap,
  Plus,
  Power,
  ShieldAlert,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
} from "@/components/ui";

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

interface AdminInstitutionsClientProps {
  initialInstitutions: AdminInstitutionItem[];
  initialEducators: AdminEducatorItem[];
}

export function AdminInstitutionsClient({
  initialInstitutions,
  initialEducators,
}: AdminInstitutionsClientProps) {
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
    <div className="space-y-8">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <Card as="section" padding="md">
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
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
                      {institution.name}
                    </h3>
                    <Badge variant={institution.active ? "success" : "neutral"}>
                      {institution.active ? "Ativa" : "Inativa"}
                    </Badge>
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
          <Card padding="sm" className="overflow-hidden p-0 sm:p-0">
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
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "Ativo" : "Suspenso"}
                        </Badge>
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
  );
}
