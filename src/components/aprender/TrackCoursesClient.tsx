"use client";

import { useState } from "react";
import type { ProgressStatus } from "@prisma/client";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  FileUploadField,
  FormField,
  Progress,
  Textarea,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

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
  { label: string; variant: BadgeVariant }
> = {
  NAO_INICIADO: {
    label: "Não iniciado",
    variant: "neutral",
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    variant: "warning",
  },
  CONCLUIDO: {
    label: "Concluído",
    variant: "success",
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
      <Card as="section" padding="sm" className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <p className="text-sm font-medium text-[var(--ink-secondary)]">
            Progresso na trilha: {completedCount} de {totalCourses} cursos
            concluídos
          </p>
          <span className="font-mono text-sm font-semibold text-[var(--stage-learn-ink)] tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <Progress
          value={completedCount}
          max={totalCourses || 1}
          tone="learn"
          label={`Progresso na trilha: ${completedCount} de ${totalCourses} cursos concluídos`}
        />
      </Card>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="Nenhum curso cadastrado nesta trilha ainda."
        />
      ) : (
        <ol className="space-y-4">
          {courses.map((course) => {
            const badge = STATUS_BADGES[course.status];
            const isFormOpen = openFormId === course.id;
            const selectedFile = fileByCourse[course.id] ?? null;
            const errorMsg = errorByCourse[course.id];

            return (
              <li key={course.id}>
                <Card as="article" padding="sm" className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--stage-learn-bg)] font-mono text-xs font-bold text-[var(--stage-learn-ink)]">
                        {course.order}
                      </span>
                      <Badge variant={badge.variant}>
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
                      </Badge>
                      {course.certificateFileId && (
                        <Badge variant="brand">
                          <FileCheck2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Certificado anexado
                        </Badge>
                      )}
                    </div>

                    <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
                      {course.title}
                    </h2>
                    <p className="text-sm text-[var(--ink-secondary)]">
                      Provedor:{" "}
                      <span className="font-medium">{course.providerName}</span>
                    </p>

                    {course.notes && course.status === "CONCLUIDO" && (
                      <div className="mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3 text-sm text-[var(--ink-secondary)]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                          Seu resumo de aprendizagem
                        </p>
                        <p className="mt-1 whitespace-pre-line">{course.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStartCourse(course)}
                      loading={startingId === course.id}
                      leftIcon={
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      }
                    >
                      Acessar curso
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={() =>
                        setOpenFormId(isFormOpen ? null : course.id)
                      }
                      leftIcon={
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      }
                    >
                      {course.status === "CONCLUIDO"
                        ? "Atualizar conclusão"
                        : "Concluir"}
                    </Button>
                  </div>
                </div>

                {errorMsg && !isFormOpen && (
                  <Alert variant="danger" className="mt-3">
                    {errorMsg}
                  </Alert>
                )}

                {isFormOpen && (
                  <form
                    onSubmit={(e) => handleCompleteCourse(e, course)}
                    className="mt-4 space-y-4 border-t border-[var(--border-subtle)] pt-4"
                  >
                    <FormField
                      id={`notes-${course.id}`}
                      label="Mini-resumo do que você aprendeu"
                      required
                    >
                      <Textarea
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
                      />
                    </FormField>

                    <div className="space-y-2">
                      <FileUploadField
                        id={`file-${course.id}`}
                        label="Certificado (opcional)"
                        hint="PDF, PNG ou JPG, máx. 5 MB."
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        file={selectedFile}
                        onFileChange={(file) =>
                          setFileByCourse((prev) => ({
                            ...prev,
                            [course.id]: file,
                          }))
                        }
                      />

                      {selectedFile && (
                        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 pt-1 text-sm text-[var(--ink-secondary)]">
                          <input
                            type="checkbox"
                            checked={Boolean(addToPortfolioByCourse[course.id])}
                            onChange={(e) =>
                              setAddToPortfolioByCourse((prev) => ({
                                ...prev,
                                [course.id]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                          />
                          <span>
                            Incluir este certificado no meu portfólio
                            compartilhável
                          </span>
                        </label>
                      )}
                    </div>

                    {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={submittingId === course.id}
                      >
                        Salvar conclusão
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenFormId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
