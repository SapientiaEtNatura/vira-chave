"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Compass,
  ExternalLink,
  Layers,
  Pencil,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
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
  Textarea,
} from "@/components/ui";

export interface AdminMacroArea {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface AdminDiscoveryQuestion {
  id: string;
  prompt: string;
  order: number;
  weightsByArea: Record<string, number>;
}

export interface AdminTrack {
  id: string;
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
  macroArea: { id: string; name: string; slug: string };
}

export interface AdminCourseItem {
  id: string;
  trackId: string;
  title: string;
  providerName: string;
  externalUrl: string;
  order: number;
  track: { id: string; title: string };
}

export interface AdminChallenge {
  id: string;
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
  macroArea: { id: string; name: string; slug: string };
}

type ContentTab =
  | "macroAreas"
  | "questions"
  | "tracks"
  | "courseItems"
  | "challenges";

type ContentKind =
  | "macroArea"
  | "question"
  | "track"
  | "courseItem"
  | "challenge";

interface PendingDelete {
  kind: ContentKind;
  id: string;
  label: string;
}

interface AdminContentClientProps {
  initialMacroAreas: AdminMacroArea[];
  initialQuestions: AdminDiscoveryQuestion[];
  initialTracks: AdminTrack[];
  initialCourseItems: AdminCourseItem[];
  initialChallenges: AdminChallenge[];
}

function buildWeightsState(
  areas: AdminMacroArea[],
  existing?: Record<string, number>,
): Record<string, string> {
  const next: Record<string, string> = {};
  if (existing) {
    for (const [slug, value] of Object.entries(existing)) {
      next[slug] = String(value);
    }
  }
  for (const area of areas) {
    if (next[area.slug] === undefined) {
      next[area.slug] = "0";
    }
  }
  return next;
}

export function AdminContentClient({
  initialMacroAreas,
  initialQuestions,
  initialTracks,
  initialCourseItems,
  initialChallenges,
}: AdminContentClientProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>("macroAreas");
  const [macroAreas, setMacroAreas] =
    useState<AdminMacroArea[]>(initialMacroAreas);
  const [questions, setQuestions] =
    useState<AdminDiscoveryQuestion[]>(initialQuestions);
  const [tracks, setTracks] = useState<AdminTrack[]>(initialTracks);
  const [courseItems, setCourseItems] =
    useState<AdminCourseItem[]>(initialCourseItems);
  const [challenges, setChallenges] =
    useState<AdminChallenge[]>(initialChallenges);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  // MacroArea form state
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [macroName, setMacroName] = useState("");
  const [macroSlug, setMacroSlug] = useState("");
  const [macroDescription, setMacroDescription] = useState("");

  // Question form state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionOrder, setQuestionOrder] = useState(() => {
    const maxOrder = initialQuestions.reduce(
      (max, q) => Math.max(max, q.order),
      0,
    );
    return String(maxOrder + 1);
  });
  const [questionWeights, setQuestionWeights] = useState<
    Record<string, string>
  >(() => buildWeightsState(initialMacroAreas));

  // Track form state
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackMacroId, setTrackMacroId] = useState(
    initialMacroAreas[0]?.id ?? "",
  );
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackPublished, setTrackPublished] = useState(true);

  // CourseItem form state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseTrackId, setCourseTrackId] = useState(
    initialTracks[0]?.id ?? "",
  );
  const [courseTitle, setCourseTitle] = useState("");
  const [courseProvider, setCourseProvider] = useState("");
  const [courseUrl, setCourseUrl] = useState("");
  const [courseOrder, setCourseOrder] = useState(() => {
    const firstTrackId = initialTracks[0]?.id ?? "";
    const maxOrder = initialCourseItems
      .filter((c) => c.trackId === firstTrackId)
      .reduce((max, c) => Math.max(max, c.order), 0);
    return String(maxOrder + 1);
  });

  // Challenge form state
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(
    null,
  );
  const [challengeMacroId, setChallengeMacroId] = useState(
    initialMacroAreas[0]?.id ?? "",
  );
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePublished, setChallengePublished] = useState(true);

  const macroAreaNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const area of macroAreas) {
      map.set(area.slug, area.name);
    }
    return map;
  }, [macroAreas]);

  function clearMessages() {
    setError(null);
    setFeedback(null);
  }

  async function sendContentRequest<T>(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ): Promise<T | null> {
    clearMessages();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/content", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as T & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Não foi possível salvar a alteração.");
        return null;
      }
      return payload;
    } catch {
      setError("Erro de conexão ao comunicar com o servidor.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  // MacroArea handlers
  function resetMacroForm() {
    setEditingMacroId(null);
    setMacroName("");
    setMacroSlug("");
    setMacroDescription("");
  }

  async function handleMacroSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminMacroArea }>(
      editingMacroId ? "PATCH" : "POST",
      editingMacroId
        ? {
            kind: "macroArea",
            id: editingMacroId,
            name: macroName,
            slug: macroSlug,
            description: macroDescription,
          }
        : {
            kind: "macroArea",
            name: macroName,
            slug: macroSlug,
            description: macroDescription,
          },
    );
    if (!payload?.item) return;

    if (editingMacroId) {
      setMacroAreas((prev) =>
        prev.map((m) => (m.id === payload.item.id ? payload.item : m)),
      );
      setTracks((prev) =>
        prev.map((t) =>
          t.macroAreaId === payload.item.id
            ? {
                ...t,
                macroArea: {
                  id: payload.item.id,
                  name: payload.item.name,
                  slug: payload.item.slug,
                },
              }
            : t,
        ),
      );
      setChallenges((prev) =>
        prev.map((c) =>
          c.macroAreaId === payload.item.id
            ? {
                ...c,
                macroArea: {
                  id: payload.item.id,
                  name: payload.item.name,
                  slug: payload.item.slug,
                },
              }
            : c,
        ),
      );
      setFeedback("Macroárea atualizada.");
    } else {
      setMacroAreas((prev) => [...prev, payload.item]);
      if (!trackMacroId) setTrackMacroId(payload.item.id);
      if (!challengeMacroId) setChallengeMacroId(payload.item.id);
      setQuestionWeights((prev) => ({
        ...prev,
        [payload.item.slug]: prev[payload.item.slug] ?? "0",
      }));
      setFeedback("Macroárea criada.");
    }
    resetMacroForm();
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const { kind, id } = pendingDelete;

    const payload = await sendContentRequest<{ deleted: boolean }>("DELETE", {
      kind,
      id,
    });
    setPendingDelete(null);
    if (!payload?.deleted) return;

    if (kind === "macroArea") {
      const removedTrackIds = new Set(
        tracks.filter((item) => item.macroAreaId === id).map((item) => item.id),
      );
      setMacroAreas((prev) => prev.filter((item) => item.id !== id));
      setTracks((prev) => prev.filter((item) => item.macroAreaId !== id));
      setCourseItems((prev) =>
        prev.filter((item) => !removedTrackIds.has(item.trackId)),
      );
      setChallenges((prev) => prev.filter((item) => item.macroAreaId !== id));
    } else if (kind === "question") {
      setQuestions((prev) => prev.filter((item) => item.id !== id));
    } else if (kind === "track") {
      setTracks((prev) => prev.filter((item) => item.id !== id));
      setCourseItems((prev) => prev.filter((item) => item.trackId !== id));
    } else if (kind === "courseItem") {
      setCourseItems((prev) => prev.filter((item) => item.id !== id));
    } else if (kind === "challenge") {
      setChallenges((prev) => prev.filter((item) => item.id !== id));
    }
    setFeedback("Registro removido.");
  }

  // Question handlers
  function resetQuestionForm(nextQuestions?: unknown) {
    const list = Array.isArray(nextQuestions)
      ? (nextQuestions as AdminDiscoveryQuestion[])
      : questions;
    setEditingQuestionId(null);
    setQuestionPrompt("");
    const maxOrder = list.reduce((max, q) => Math.max(max, q.order), 0);
    setQuestionOrder(String(maxOrder + 1));
    setQuestionWeights(buildWeightsState(macroAreas));
  }

  async function handleQuestionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsedWeights: Record<string, number> = {};

    for (const [slug, rawValue] of Object.entries(questionWeights)) {
      const trimmed = rawValue.trim();
      const numeric = trimmed === "" ? 0 : Number(trimmed);
      if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10) {
        setError(
          `O peso de "${macroAreaNameBySlug.get(slug) ?? slug}" deve ser um número inteiro entre 0 e 10.`,
        );
        return;
      }
      parsedWeights[slug] = numeric;
    }

    const payload = await sendContentRequest<{ item: AdminDiscoveryQuestion }>(
      editingQuestionId ? "PATCH" : "POST",
      editingQuestionId
        ? {
            kind: "question",
            id: editingQuestionId,
            prompt: questionPrompt,
            order: Number(questionOrder),
            weightsByArea: parsedWeights,
          }
        : {
            kind: "question",
            prompt: questionPrompt,
            order: Number(questionOrder),
            weightsByArea: parsedWeights,
          },
    );
    if (!payload?.item) return;

    let updatedList: AdminDiscoveryQuestion[];
    if (editingQuestionId) {
      updatedList = questions
        .map((q) => (q.id === payload.item.id ? payload.item : q))
        .sort((a, b) => a.order - b.order);
      setQuestions(updatedList);
      setFeedback("Pergunta atualizada.");
    } else {
      updatedList = [...questions, payload.item].sort(
        (a, b) => a.order - b.order,
      );
      setQuestions(updatedList);
      setFeedback("Pergunta criada.");
    }
    resetQuestionForm(updatedList);
  }

  // Track handlers
  function resetTrackForm() {
    setEditingTrackId(null);
    setTrackMacroId(macroAreas[0]?.id ?? "");
    setTrackTitle("");
    setTrackDescription("");
    setTrackPublished(true);
  }

  async function handleTrackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminTrack }>(
      editingTrackId ? "PATCH" : "POST",
      editingTrackId
        ? {
            kind: "track",
            id: editingTrackId,
            macroAreaId: trackMacroId,
            title: trackTitle,
            description: trackDescription,
            published: trackPublished,
          }
        : {
            kind: "track",
            macroAreaId: trackMacroId,
            title: trackTitle,
            description: trackDescription,
            published: trackPublished,
          },
    );
    if (!payload?.item) return;

    if (editingTrackId) {
      setTracks((prev) =>
        prev.map((t) => (t.id === payload.item.id ? payload.item : t)),
      );
      setCourseItems((prev) =>
        prev.map((c) =>
          c.trackId === payload.item.id
            ? {
                ...c,
                track: { id: payload.item.id, title: payload.item.title },
              }
            : c,
        ),
      );
      setFeedback("Trilha atualizada.");
    } else {
      setTracks((prev) => [...prev, payload.item]);
      if (!courseTrackId) setCourseTrackId(payload.item.id);
      setFeedback("Trilha criada.");
    }
    resetTrackForm();
  }

  // CourseItem handlers
  function resetCourseForm(overrideTrackId?: unknown) {
    const targetTrackId =
      typeof overrideTrackId === "string"
        ? overrideTrackId
        : (tracks[0]?.id ?? "");
    setEditingCourseId(null);
    setCourseTrackId(targetTrackId);
    setCourseTitle("");
    setCourseProvider("");
    setCourseUrl("");
    const maxOrder = courseItems
      .filter((c) => c.trackId === targetTrackId)
      .reduce((max, c) => Math.max(max, c.order), 0);
    setCourseOrder(String(maxOrder + 1));
  }

  async function handleCourseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminCourseItem }>(
      editingCourseId ? "PATCH" : "POST",
      editingCourseId
        ? {
            kind: "courseItem",
            id: editingCourseId,
            trackId: courseTrackId,
            title: courseTitle,
            providerName: courseProvider,
            externalUrl: courseUrl,
            order: Number(courseOrder),
          }
        : {
            kind: "courseItem",
            trackId: courseTrackId,
            title: courseTitle,
            providerName: courseProvider,
            externalUrl: courseUrl,
            order: Number(courseOrder),
          },
    );
    if (!payload?.item) return;

    if (editingCourseId) {
      setCourseItems((prev) =>
        prev.map((c) => (c.id === payload.item.id ? payload.item : c)),
      );
      setFeedback("Curso externo atualizado.");
    } else {
      setCourseItems((prev) => [...prev, payload.item]);
      setFeedback("Curso externo adicionado.");
    }
    resetCourseForm();
  }

  // Challenge handlers
  function resetChallengeForm() {
    setEditingChallengeId(null);
    setChallengeMacroId(macroAreas[0]?.id ?? "");
    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePublished(true);
  }

  async function handleChallengeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminChallenge }>(
      editingChallengeId ? "PATCH" : "POST",
      editingChallengeId
        ? {
            kind: "challenge",
            id: editingChallengeId,
            macroAreaId: challengeMacroId,
            title: challengeTitle,
            description: challengeDescription,
            published: challengePublished,
          }
        : {
            kind: "challenge",
            macroAreaId: challengeMacroId,
            title: challengeTitle,
            description: challengeDescription,
            published: challengePublished,
          },
    );
    if (!payload?.item) return;

    if (editingChallengeId) {
      setChallenges((prev) =>
        prev.map((c) => (c.id === payload.item.id ? payload.item : c)),
      );
      setFeedback("Desafio atualizado.");
    } else {
      setChallenges((prev) => [...prev, payload.item]);
      setFeedback("Desafio criado.");
    }
    resetChallengeForm();
  }

  const tabs: {
    id: ContentTab;
    label: string;
    count: number;
    icon: typeof Layers;
  }[] = [
    {
      id: "macroAreas",
      label: "MacroÁreas",
      count: macroAreas.length,
      icon: Layers,
    },
    {
      id: "questions",
      label: "Perguntas do Descobrir",
      count: questions.length,
      icon: Compass,
    },
    {
      id: "tracks",
      label: "Trilhas",
      count: tracks.length,
      icon: BookOpen,
    },
    {
      id: "courseItems",
      label: "Cursos Externos",
      count: courseItems.length,
      icon: Sparkles,
    },
    {
      id: "challenges",
      label: "Desafios Práticos",
      count: challenges.length,
      icon: Rocket,
    },
  ];

  const legacyQuestionSlugs = useMemo(() => {
    const knownSlugs = new Set(macroAreas.map((area) => area.slug));
    return Object.keys(questionWeights).filter((slug) => !knownSlugs.has(slug));
  }, [macroAreas, questionWeights]);

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Seções de curadoria de conteúdo"
        className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => {
                clearMessages();
                setActiveTab(tab.id);
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? "bg-[var(--brand-primary)] text-white shadow-xs"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[var(--bg-surface-subtle)] text-[var(--ink-muted)]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      {activeTab === "macroAreas" && (
        <section
          id="panel-macroAreas"
          role="tabpanel"
          aria-labelledby="tab-macroAreas"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card as="div" padding="md" className="h-fit lg:col-span-1">
            <form onSubmit={handleMacroSubmit} className="space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                {editingMacroId ? "Editar MacroÁrea" : "Nova MacroÁrea"}
              </h2>

              <FormField id="macro-name" label="Nome" required>
                <Input
                  type="text"
                  required
                  value={macroName}
                  onChange={(e) => setMacroName(e.target.value)}
                  placeholder="Ex: Tecnologia e Dados"
                />
              </FormField>

              <FormField id="macro-slug" label="Slug" required>
                <Input
                  type="text"
                  required
                  value={macroSlug}
                  onChange={(e) => setMacroSlug(e.target.value)}
                  placeholder="tecnologia-dados"
                />
              </FormField>

              <FormField id="macro-description" label="Descrição" required>
                <Textarea
                  required
                  rows={3}
                  value={macroDescription}
                  onChange={(e) => setMacroDescription(e.target.value)}
                />
              </FormField>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="min-h-11 flex-1"
                >
                  {editingMacroId ? "Salvar" : "Criar"}
                </Button>
                {editingMacroId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetMacroForm}
                    className="min-h-11"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {macroAreas.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-6 w-6" />}
                title="Nenhuma MacroÁrea cadastrada"
                description="Crie a primeira MacroÁrea ao lado para organizar perguntas, trilhas e desafios."
              />
            ) : (
              macroAreas.map((area) => (
                <Card
                  key={area.id}
                  padding="sm"
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                        {area.name}
                      </h3>
                      <Badge variant="neutral" className="font-mono">
                        {area.slug}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                      {area.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setEditingMacroId(area.id);
                        setMacroName(area.name);
                        setMacroSlug(area.slug);
                        setMacroDescription(area.description);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() =>
                        setPendingDelete({
                          kind: "macroArea",
                          id: area.id,
                          label: area.name,
                        })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "questions" && (
        <section
          id="panel-questions"
          role="tabpanel"
          aria-labelledby="tab-questions"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card as="div" padding="md" className="h-fit lg:col-span-1">
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                {editingQuestionId
                  ? "Editar pergunta"
                  : "Nova pergunta do Descobrir"}
              </h2>

              <FormField id="question-order" label="Ordem" required>
                <Input
                  type="number"
                  min={1}
                  required
                  value={questionOrder}
                  onChange={(e) => setQuestionOrder(e.target.value)}
                />
              </FormField>

              <FormField id="question-prompt" label="Enunciado" required>
                <Textarea
                  required
                  rows={3}
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                />
              </FormField>

              <div className="space-y-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5">
                <div>
                  <p className="text-sm font-medium text-[var(--ink-primary)]">
                    Pesos por MacroÁrea
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Defina de 0 a 10 o quanto esta pergunta pontua para cada
                    MacroÁrea.
                  </p>
                </div>

                {macroAreas.length === 0 ? (
                  <p className="text-xs text-[var(--ink-muted)]">
                    Cadastre ao menos uma MacroÁrea para configurar pesos.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {macroAreas.map((area) => (
                      <FormField
                        key={area.id}
                        id={`question-weight-${area.slug}`}
                        label={area.name}
                      >
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                          value={questionWeights[area.slug] ?? "0"}
                          onChange={(e) =>
                            setQuestionWeights((prev) => ({
                              ...prev,
                              [area.slug]: e.target.value,
                            }))
                          }
                        />
                      </FormField>
                    ))}
                  </div>
                )}

                {legacyQuestionSlugs.length > 0 ? (
                  <p className="text-xs text-[var(--ink-muted)]">
                    Chaves legadas preservadas ao salvar:{" "}
                    {legacyQuestionSlugs.join(", ")}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="min-h-11 flex-1"
                >
                  {editingQuestionId ? "Salvar" : "Criar"}
                </Button>
                {editingQuestionId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetQuestionForm()}
                    className="min-h-11"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {questions.length === 0 ? (
              <EmptyState
                icon={<Compass className="h-6 w-6" />}
                title="Nenhuma pergunta cadastrada"
                description="Adicione perguntas para compor a etapa Descobrir dos estudantes."
              />
            ) : (
              questions.map((question) => {
                const activeWeights = Object.entries(
                  question.weightsByArea,
                ).filter(([, weight]) => weight > 0);

                return (
                  <Card
                    key={question.id}
                    padding="sm"
                    className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="brand">#{question.order}</Badge>
                        <p className="text-sm font-semibold text-[var(--ink-primary)]">
                          {question.prompt}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeWeights.length === 0 ? (
                          <span className="text-xs text-[var(--ink-muted)]">
                            Sem pesos atribuídos
                          </span>
                        ) : (
                          activeWeights.map(([slug, weight]) => (
                            <Badge key={slug} variant="neutral">
                              {macroAreaNameBySlug.get(slug) ?? slug}: {weight}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setEditingQuestionId(question.id);
                          setQuestionOrder(String(question.order));
                          setQuestionPrompt(question.prompt);
                          setQuestionWeights(
                            buildWeightsState(
                              macroAreas,
                              question.weightsByArea,
                            ),
                          );
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() =>
                          setPendingDelete({
                            kind: "question",
                            id: question.id,
                            label: `Pergunta #${question.order}`,
                          })
                        }
                      >
                        Excluir
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      )}

      {activeTab === "tracks" && (
        <section
          id="panel-tracks"
          role="tabpanel"
          aria-labelledby="tab-tracks"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card as="div" padding="md" className="h-fit lg:col-span-1">
            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                {editingTrackId ? "Editar trilha" : "Nova trilha"}
              </h2>

              <FormField id="track-macro-area" label="MacroÁrea" required>
                <Select
                  required
                  value={trackMacroId}
                  onChange={(e) => setTrackMacroId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {macroAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField id="track-title" label="Título" required>
                <Input
                  type="text"
                  required
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                />
              </FormField>

              <FormField id="track-description" label="Descrição" required>
                <Textarea
                  required
                  rows={3}
                  value={trackDescription}
                  onChange={(e) => setTrackDescription(e.target.value)}
                />
              </FormField>

              <label
                htmlFor="track-published"
                className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--ink-secondary)]"
              >
                <input
                  id="track-published"
                  type="checkbox"
                  checked={trackPublished}
                  onChange={(e) => setTrackPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                />
                <span>Publicada para estudantes</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="min-h-11 flex-1"
                >
                  {editingTrackId ? "Salvar" : "Criar"}
                </Button>
                {editingTrackId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetTrackForm}
                    className="min-h-11"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {tracks.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-6 w-6" />}
                title="Nenhuma trilha cadastrada"
                description="Crie uma trilha de aprendizagem para vincular cursos externos na etapa Aprender."
              />
            ) : (
              tracks.map((track) => (
                <Card
                  key={track.id}
                  padding="sm"
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                        {track.title}
                      </h3>
                      <Badge variant="brand">{track.macroArea.name}</Badge>
                      <Badge variant={track.published ? "success" : "neutral"}>
                        {track.published ? "Publicada" : "Rascunho"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                      {track.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setEditingTrackId(track.id);
                        setTrackMacroId(track.macroAreaId);
                        setTrackTitle(track.title);
                        setTrackDescription(track.description);
                        setTrackPublished(track.published);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() =>
                        setPendingDelete({
                          kind: "track",
                          id: track.id,
                          label: track.title,
                        })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "courseItems" && (
        <section
          id="panel-courseItems"
          role="tabpanel"
          aria-labelledby="tab-courseItems"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card as="div" padding="md" className="h-fit lg:col-span-1">
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                {editingCourseId
                  ? "Editar curso externo"
                  : "Novo curso externo"}
              </h2>

              <FormField id="course-track" label="Trilha" required>
                <Select
                  required
                  value={courseTrackId}
                  onChange={(e) => setCourseTrackId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.title}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField id="course-title" label="Título do curso" required>
                <Input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </FormField>

              <FormField id="course-provider" label="Provedor" required>
                <Input
                  type="text"
                  required
                  value={courseProvider}
                  onChange={(e) => setCourseProvider(e.target.value)}
                  placeholder="Ex: Fundação Bradesco, Khan Academy"
                />
              </FormField>

              <FormField id="course-url" label="URL externa" required>
                <Input
                  type="url"
                  required
                  value={courseUrl}
                  onChange={(e) => setCourseUrl(e.target.value)}
                  placeholder="https://..."
                />
              </FormField>

              <FormField id="course-order" label="Ordem na trilha" required>
                <Input
                  type="number"
                  min={1}
                  required
                  value={courseOrder}
                  onChange={(e) => setCourseOrder(e.target.value)}
                />
              </FormField>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="min-h-11 flex-1"
                >
                  {editingCourseId ? "Salvar" : "Adicionar"}
                </Button>
                {editingCourseId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetCourseForm()}
                    className="min-h-11"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {courseItems.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="Nenhum curso externo cadastrado"
                description="Adicione cursos externos gratuitos às trilhas de aprendizagem."
              />
            ) : (
              courseItems.map((course) => (
                <Card
                  key={course.id}
                  padding="sm"
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">#{course.order}</Badge>
                      <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                        {course.title}
                      </h3>
                      <Badge variant="brand">{course.track.title}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                      Provedor:{" "}
                      <span className="font-semibold">
                        {course.providerName}
                      </span>
                    </p>
                    <a
                      href={course.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 break-all text-xs text-[var(--brand-primary)] hover:underline"
                    >
                      <span>{course.externalUrl}</span>
                      <ExternalLink
                        className="h-3 w-3 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setEditingCourseId(course.id);
                        setCourseTrackId(course.trackId);
                        setCourseTitle(course.title);
                        setCourseProvider(course.providerName);
                        setCourseUrl(course.externalUrl);
                        setCourseOrder(String(course.order));
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() =>
                        setPendingDelete({
                          kind: "courseItem",
                          id: course.id,
                          label: course.title,
                        })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "challenges" && (
        <section
          id="panel-challenges"
          role="tabpanel"
          aria-labelledby="tab-challenges"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card as="div" padding="md" className="h-fit lg:col-span-1">
            <form onSubmit={handleChallengeSubmit} className="space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--ink-primary)]">
                {editingChallengeId
                  ? "Editar desafio"
                  : "Novo desafio prático"}
              </h2>

              <FormField id="challenge-macro-area" label="MacroÁrea" required>
                <Select
                  required
                  value={challengeMacroId}
                  onChange={(e) => setChallengeMacroId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {macroAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField id="challenge-title" label="Título" required>
                <Input
                  type="text"
                  required
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                />
              </FormField>

              <FormField id="challenge-description" label="Descrição" required>
                <Textarea
                  required
                  rows={4}
                  value={challengeDescription}
                  onChange={(e) => setChallengeDescription(e.target.value)}
                />
              </FormField>

              <label
                htmlFor="challenge-published"
                className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--ink-secondary)]"
              >
                <input
                  id="challenge-published"
                  type="checkbox"
                  checked={challengePublished}
                  onChange={(e) => setChallengePublished(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                />
                <span>Publicado para estudantes</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="min-h-11 flex-1"
                >
                  {editingChallengeId ? "Salvar" : "Criar"}
                </Button>
                {editingChallengeId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetChallengeForm}
                    className="min-h-11"
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {challenges.length === 0 ? (
              <EmptyState
                icon={<Rocket className="h-6 w-6" />}
                title="Nenhum desafio cadastrado"
                description="Crie desafios práticos para a etapa Experimentar dos estudantes."
              />
            ) : (
              challenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  padding="sm"
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                        {challenge.title}
                      </h3>
                      <Badge variant="brand">{challenge.macroArea.name}</Badge>
                      <Badge
                        variant={challenge.published ? "success" : "neutral"}
                      >
                        {challenge.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setEditingChallengeId(challenge.id);
                        setChallengeMacroId(challenge.macroAreaId);
                        setChallengeTitle(challenge.title);
                        setChallengeDescription(challenge.description);
                        setChallengePublished(challenge.published);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() =>
                        setPendingDelete({
                          kind: "challenge",
                          id: challenge.id,
                          label: challenge.title,
                        })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Confirmar exclusão"
        description={
          pendingDelete
            ? `Tem certeza que deseja excluir "${pendingDelete.label}"? Registros vinculados também podem ser removidos.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={busy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
