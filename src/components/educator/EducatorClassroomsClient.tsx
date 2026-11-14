"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Plus,
  Power,
  Users,
} from "lucide-react";

export interface EducatorClassroomItem {
  id: string;
  name: string;
  inviteCode: string;
  active: boolean;
  createdAt: string;
  institutionName: string;
  studentCount: number;
}

interface EducatorClassroomsClientProps {
  initialClassrooms: EducatorClassroomItem[];
  institutionName: string | null;
}

export function EducatorClassroomsClient({
  initialClassrooms,
  institutionName,
}: EducatorClassroomsClientProps) {
  const [classrooms, setClassrooms] =
    useState<EducatorClassroomItem[]>(initialClassrooms);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setError("Informe um nome de turma com pelo menos 2 caracteres.");
      return;
    }

    setError(null);
    setCreating(true);
    try {
      const response = await fetch("/api/educator/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const payload = (await response.json()) as {
        classroom?: EducatorClassroomItem;
        error?: string;
      };

      if (!response.ok || !payload.classroom) {
        setError(payload.error ?? "Não foi possível criar a turma.");
        return;
      }

      setClassrooms((prev) => [payload.classroom!, ...prev]);
      setNewName("");
    } catch {
      setError("Erro de conexão ao criar turma.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(classroom: EducatorClassroomItem) {
    setError(null);
    setTogglingId(classroom.id);
    try {
      const response = await fetch(`/api/educator/classrooms/${classroom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !classroom.active }),
      });

      const payload = (await response.json()) as {
        classroom?: EducatorClassroomItem;
        error?: string;
      };

      if (!response.ok || !payload.classroom) {
        setError(payload.error ?? "Não foi possível atualizar a turma.");
        return;
      }

      setClassrooms((prev) =>
        prev.map((item) =>
          item.id === classroom.id ? payload.classroom! : item,
        ),
      );
    } catch {
      setError("Erro de conexão ao atualizar turma.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCopyCode(classroom: EducatorClassroomItem) {
    try {
      await navigator.clipboard.writeText(classroom.inviteCode);
      setCopiedId(classroom.id);
      setTimeout(() => {
        setCopiedId((current) => (current === classroom.id ? null : current));
      }, 2000);
    } catch {
      setError("Não foi possível copiar o código automaticamente.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Criar nova turma
            </h2>
            <p className="text-sm text-slate-600">
              {institutionName
                ? `Instituição vinculada: ${institutionName}`
                : "Crie turmas e compartilhe o código de convite com seus estudantes."}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex.: 3º Ano B — Projeto de Vida"
            maxLength={120}
            aria-label="Nome da nova turma"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{creating ? "Criando..." : "Criar turma"}</span>
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Minhas turmas ({classrooms.length})
          </h2>
        </div>

        {classrooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Users
              className="mx-auto h-10 w-10 text-slate-400"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              Nenhuma turma criada ainda
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Crie sua primeira turma acima para gerar um código de convite e
              acompanhar a jornada dos estudantes.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classrooms.map((classroom) => (
              <article
                key={classroom.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {classroom.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {classroom.institutionName}
                      </p>
                    </div>
                    <span
                      className={
                        classroom.active
                          ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                          : "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                      }
                    >
                      {classroom.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Código de convite
                      </span>
                      <span className="font-mono text-sm font-bold tracking-wider text-slate-900">
                        {classroom.inviteCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(classroom)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {copiedId === classroom.id ? (
                        <>
                          <Check
                            className="h-3.5 w-3.5 text-emerald-600"
                            aria-hidden="true"
                          />
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

                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span>
                      {classroom.studentCount}{" "}
                      {classroom.studentCount === 1
                        ? "estudante vinculado"
                        : "estudantes vinculados"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={togglingId === classroom.id}
                    onClick={() => handleToggleActive(classroom)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    <Power className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {classroom.active ? "Desativar código" : "Ativar código"}
                    </span>
                  </button>

                  <Link
                    href={`/educador/turmas/${classroom.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <span>Ver visão educacional</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
