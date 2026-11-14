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
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Nova Instituição Parceira
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          O código institucional permite que educadores dessa escola se cadastrem na
          plataforma. Se omitido, um código único será gerado automaticamente.
        </p>

        <form
          onSubmit={handleCreateInstitution}
          className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end"
        >
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Nome da Escola / Instituição
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: E.E. Machado de Assis"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Código Institucional (opcional)
            </label>
            <input
              type="text"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
              placeholder="Ex: INST-MACHADO"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {creating ? "Cadastrando..." : "Cadastrar Instituição"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">
            Instituições Parceiras ({institutions.length})
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {institutions.map((institution) => (
            <div
              key={institution.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {institution.name}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      institution.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {institution.active ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800">
                    {institution.institutionCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(institution)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copiedId === institution.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copiar código</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  {institution.userCount} usuários vinculados ·{" "}
                  {institution.classroomCount} turmas
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  {institution.active
                    ? "Aceita novos educadores"
                    : "Bloqueada para novos cadastros"}
                </span>
                <button
                  type="button"
                  disabled={togglingId === institution.id}
                  onClick={() => handleToggleInstitution(institution)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                    institution.active
                      ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <Power className="h-3.5 w-3.5" aria-hidden="true" />
                  {institution.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">
            Educadores Vinculados ({educators.length})
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {educators.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              Nenhum educador cadastrado até o momento.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {educators.map((educator) => {
                const isActive = educator.status === "ACTIVE";
                return (
                  <div
                    key={educator.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {educator.name}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {isActive ? "Ativo" : "Suspenso"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{educator.email}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Instituição:{" "}
                        <span className="font-medium text-slate-700">
                          {educator.institutionName ?? "Sem vínculo"}
                        </span>
                        {educator.institutionActive === false && (
                          <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                            <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                            Instituição inativa (conta mantida)
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={togglingId === educator.id}
                      onClick={() => handleToggleEducatorStatus(educator)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                        isActive
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      {isActive ? "Suspender" : "Reativar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
