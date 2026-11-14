"use client";

import { useState } from "react";
import type { ProgressStatus } from "@prisma/client";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Loader2,
  Upload,
} from "lucide-react";

export interface TrackCourseItemView {
  id: string;
  order: number;
  title: string;
  providerName: string;
  externalUrl: string;
  status: ProgressStatus;
  notes: string | null;
  certificateFileId: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface TrackCoursesClientProps {
  initialCourses: TrackCourseItemView[];
}

const STATUS_BADGES: Record<
  ProgressStatus,
  { label: string; className: string }
> = {
  NAO_INICIADO: {
    label: "Não iniciado",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  CONCLUIDO: {
    label: "Concluído",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export function TrackCoursesClient({
  initialCourses,
}: TrackCoursesClientProps) {
  const [courses, setCourses] = useState<TrackCourseItemView[]>(initialCourses);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [notesByCourse, setNotesByCourse] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialCourses.map((course) => [course.id, course.notes ?? ""]),
      ),
  );
  const [fileByCourse, setFileByCourse] = useState<Record<string, File | null>>(
    {},
  );
  const [addToPortfolioByCourse, setAddToPortfolioByCourse] = useState<
    Record<string, boolean>
  >({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorByCourse, setErrorByCourse] = useState<Record<string, string>>(
    {},
  );

  const totalCourses = courses.length;
  const completedCount = courses.filter((c) => c.status === "CONCLUIDO").length;
  const progressPercent =
    totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  async function handleStartCourse(course: TrackCourseItemView) {
    setStartingId(course.id);
    setErrorByCourse((prev) => ({ ...prev, [course.id]: "" }));

    window.open(course.externalUrl, "_blank", "noopener,noreferrer");

    try {
      const response = await fetch(`/api/tracks/${course.id}/start`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorByCourse((prev) => ({
          ...prev,
          [course.id]:
            data?.error ?? "Não foi possível registrar o acesso ao curso.",
        }));
        return;
      }

      if (data?.progress) {
        setCourses((prev) =>
          prev.map((item) =>
            item.id === course.id
              ? {
                  ...item,
                  status: data.progress.status,
                  startedAt: data.progress.startedAt,
                  completedAt: data.progress.completedAt,
                }
              : item,
          ),
        );
      }
    } catch {
      setErrorByCourse((prev) => ({
        ...prev,
        [course.id]: "Erro de conexão ao registrar início do curso.",
      }));
    } finally {
      setStartingId(null);
    }
  }

  async function handleCompleteCourse(
    event: React.FormEvent,
    course: TrackCourseItemView,
  ) {
    event.preventDefault();
    const notes = (notesByCourse[course.id] ?? "").trim();

    if (notes.length < 5) {
      setErrorByCourse((prev) => ({
        ...prev,
        [course.id]:
          "Escreva um mini-resumo com pelo menos 5 caracteres sobre o que você aprendeu.",
      }));
      return;
    }

    setSubmittingId(course.id);
    setErrorByCourse((prev) => ({ ...prev, [course.id]: "" }));

    try {
      const formData = new FormData();
      formData.append("notes", notes);

      const selectedFile = fileByCourse[course.id];
      if (selectedFile) {
        formData.append("file", selectedFile);
        formData.append(
          "addToPortfolio",
          addToPortfolioByCourse[course.id] ? "true" : "false",
        );
      }

      const response = await fetch(`/api/tracks/${course.id}/complete`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorByCourse((prev) => ({
          ...prev,
          [course.id]: data?.error ?? "Não foi possível concluir o curso.",
        }));
        return;
      }

      if (data?.progress) {
        setCourses((prev) =>
          prev.map((item) =>
            item.id === course.id
              ? {
                  ...item,
                  status: data.progress.status,
                  notes: data.progress.notes,
                  certificateFileId: data.progress.certificateFileId,
                  startedAt: data.progress.startedAt,
                  completedAt: data.progress.completedAt,
                }
              : item,
          ),
        );
      }

      setFileByCourse((prev) => ({ ...prev, [course.id]: null }));
      setOpenFormId(null);
    } catch {
      setErrorByCourse((prev) => ({
        ...prev,
        [course.id]: "Erro de conexão ao salvar conclusão.",
      }));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">
            Progresso na trilha: {completedCount} de {totalCourses} cursos
            concluídos
          </p>
          <span className="text-sm font-semibold text-indigo-600">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Nenhum curso cadastrado nesta trilha ainda.
        </div>
      ) : (
        <ol className="space-y-4">
          {courses.map((course) => {
            const badge = STATUS_BADGES[course.status];
            const isFormOpen = openFormId === course.id;
            const selectedFile = fileByCourse[course.id] ?? null;
            const errorMsg = errorByCourse[course.id];

            return (
              <li
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                        {course.order}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {course.status === "CONCLUIDO" && (
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                        {course.status === "EM_ANDAMENTO" && (
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {badge.label}
                      </span>
                      {course.certificateFileId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          <FileCheck2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Certificado anexado
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">
                      {course.title}
                    </h2>
                    <p className="text-sm text-slate-600">
                      Provedor: <span className="font-medium">{course.providerName}</span>
                    </p>

                    {course.notes && course.status === "CONCLUIDO" && (
                      <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Seu resumo de aprendizagem
                        </p>
                        <p className="mt-1 whitespace-pre-line">{course.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartCourse(course)}
                      disabled={startingId === course.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700 disabled:opacity-60"
                    >
                      {startingId === course.id ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>Acessar curso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenFormId(isFormOpen ? null : course.id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {course.status === "CONCLUIDO"
                          ? "Atualizar conclusão"
                          : "Concluir"}
                      </span>
                    </button>
                  </div>
                </div>

                {errorMsg && !isFormOpen && (
                  <p className="mt-3 text-sm font-medium text-rose-600">
                    {errorMsg}
                  </p>
                )}

                {isFormOpen && (
                  <form
                    onSubmit={(e) => handleCompleteCourse(e, course)}
                    className="mt-4 space-y-4 border-t border-slate-100 pt-4"
                  >
                    <div>
                      <label
                        htmlFor={`notes-${course.id}`}
                        className="block text-sm font-medium text-slate-800"
                      >
                        Mini-resumo do que você aprendeu *
                      </label>
                      <textarea
                        id={`notes-${course.id}`}
                        rows={3}
                        required
                        minLength={5}
                        value={notesByCourse[course.id] ?? ""}
                        onChange={(e) =>
                          setNotesByCourse((prev) => ({
                            ...prev,
                            [course.id]: e.target.value,
                          }))
                        }
                        placeholder="Descreva em poucas linhas os principais conceitos ou práticas que você aprendeu neste curso..."
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`file-${course.id}`}
                        className="block text-sm font-medium text-slate-800"
                      >
                        Certificado (opcional — PDF, PNG ou JPG, máx. 5 MB)
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor={`file-${course.id}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {selectedFile
                              ? selectedFile.name
                              : "Selecionar arquivo"}
                          </span>
                        </label>
                        <input
                          id={`file-${course.id}`}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setFileByCourse((prev) => ({
                              ...prev,
                              [course.id]: file,
                            }));
                          }}
                        />
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() =>
                              setFileByCourse((prev) => ({
                                ...prev,
                                [course.id]: null,
                              }))
                            }
                            className="text-xs font-medium text-slate-500 hover:text-slate-800"
                          >
                            Remover arquivo
                          </button>
                        )}
                      </div>

                      {selectedFile && (
                        <label className="flex items-center gap-2 pt-1 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(addToPortfolioByCourse[course.id])}
                            onChange={(e) =>
                              setAddToPortfolioByCourse((prev) => ({
                                ...prev,
                                [course.id]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            Incluir este certificado no meu portfólio
                            compartilhável
                          </span>
                        </label>
                      )}
                    </div>

                    {errorMsg && (
                      <p className="text-sm font-medium text-rose-600">
                        {errorMsg}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={submittingId === course.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {submittingId === course.id && (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        )}
                        <span>Salvar conclusão</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenFormId(null)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
