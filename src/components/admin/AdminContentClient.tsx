"use client";

import { useState } from "react";
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

type ContentTab = "macroAreas" | "questions" | "tracks" | "courseItems" | "challenges";

interface AdminContentClientProps {
  initialMacroAreas: AdminMacroArea[];
  initialQuestions: AdminDiscoveryQuestion[];
  initialTracks: AdminTrack[];
  initialCourseItems: AdminCourseItem[];
  initialChallenges: AdminChallenge[];
}

export function AdminContentClient({
  initialMacroAreas,
  initialQuestions,
  initialTracks,
  initialCourseItems,
  initialChallenges,
}: AdminContentClientProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>("macroAreas");
  const [macroAreas, setMacroAreas] = useState<AdminMacroArea[]>(initialMacroAreas);
  const [questions, setQuestions] = useState<AdminDiscoveryQuestion[]>(initialQuestions);
  const [tracks, setTracks] = useState<AdminTrack[]>(initialTracks);
  const [courseItems, setCourseItems] = useState<AdminCourseItem[]>(initialCourseItems);
  const [challenges, setChallenges] = useState<AdminChallenge[]>(initialChallenges);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // MacroArea form state
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [macroName, setMacroName] = useState("");
  const [macroSlug, setMacroSlug] = useState("");
  const [macroDescription, setMacroDescription] = useState("");

  // Question form state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionOrder, setQuestionOrder] = useState("1");
  const [questionWeightsText, setQuestionWeightsText] = useState("{}");

  // Track form state
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackMacroId, setTrackMacroId] = useState(initialMacroAreas[0]?.id ?? "");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackPublished, setTrackPublished] = useState(true);

  // CourseItem form state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseTrackId, setCourseTrackId] = useState(initialTracks[0]?.id ?? "");
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
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [challengeMacroId, setChallengeMacroId] = useState(initialMacroAreas[0]?.id ?? "");
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePublished, setChallengePublished] = useState(true);

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
      setFeedback("Macroárea criada.");
    }
    resetMacroForm();
  }

  async function handleDelete(
    kind: "macroArea" | "question" | "track" | "courseItem" | "challenge",
    id: string,
  ) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Tem certeza que deseja excluir este registro? Registros vinculados também podem ser removidos.",
      )
    ) {
      return;
    }

    const payload = await sendContentRequest<{ deleted: boolean }>("DELETE", {
      kind,
      id,
    });
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
    setQuestionWeightsText("{}");
  }

  async function handleQuestionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let parsedWeights: Record<string, number>;
    try {
      const raw = JSON.parse(questionWeightsText) as unknown;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        setError("Pesos por área devem ser um objeto JSON (ex: {\"tecnologia-dados\": 3}).");
        return;
      }
      parsedWeights = raw as Record<string, number>;
    } catch {
      setError("JSON inválido no campo de pesos por área.");
      return;
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

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev
          .map((q) => (q.id === payload.item.id ? payload.item : q))
          .sort((a, b) => a.order - b.order),
      );
      setFeedback("Pergunta atualizada.");
    } else {
      setQuestions((prev) =>
        [...prev, payload.item].sort((a, b) => a.order - b.order),
      );
      setFeedback("Pergunta criada.");
    }
    resetQuestionForm();
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

  const tabs: { id: ContentTab; label: string; count: number; icon: typeof Layers }[] = [
    { id: "macroAreas", label: "MacroÁreas", count: macroAreas.length, icon: Layers },
    { id: "questions", label: "Perguntas do Descobrir", count: questions.length, icon: Compass },
    { id: "tracks", label: "Trilhas", count: tracks.length, icon: BookOpen },
    { id: "courseItems", label: "Cursos Externos", count: courseItems.length, icon: Sparkles },
    { id: "challenges", label: "Desafios Práticos", count: challenges.length, icon: Rocket },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                clearMessages();
                setActiveTab(tab.id);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

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

      {activeTab === "macroAreas" && (
        <section className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleMacroSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1"
          >
            <h2 className="text-base font-bold text-slate-900">
              {editingMacroId ? "Editar MacroÁrea" : "Nova MacroÁrea"}
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Nome
              </label>
              <input
                type="text"
                required
                value={macroName}
                onChange={(e) => setMacroName(e.target.value)}
                placeholder="Ex: Tecnologia e Dados"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Slug
              </label>
              <input
                type="text"
                required
                value={macroSlug}
                onChange={(e) => setMacroSlug(e.target.value)}
                placeholder="tecnologia-dados"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Descrição
              </label>
              <textarea
                required
                rows={3}
                value={macroDescription}
                onChange={(e) => setMacroDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {editingMacroId ? "Salvar" : "Criar"}
              </button>
              {editingMacroId && (
                <button
                  type="button"
                  onClick={resetMacroForm}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3 lg:col-span-2">
            {macroAreas.map((area) => (
              <div
                key={area.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{area.name}</h3>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                      {area.slug}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{area.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMacroId(area.id);
                      setMacroName(area.name);
                      setMacroSlug(area.slug);
                      setMacroDescription(area.description);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete("macroArea", area.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "questions" && (
        <section className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleQuestionSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1"
          >
            <h2 className="text-base font-bold text-slate-900">
              {editingQuestionId ? "Editar Pergunta" : "Nova Pergunta do Descobrir"}
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Ordem
              </label>
              <input
                type="number"
                min={1}
                required
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Enunciado
              </label>
              <textarea
                required
                rows={3}
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Pesos por MacroÁrea (JSON)
              </label>
              <textarea
                required
                rows={3}
                value={questionWeightsText}
                onChange={(e) => setQuestionWeightsText(e.target.value)}
                placeholder='{"tecnologia-dados": 3, "design-criacao": 1}'
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {editingQuestionId ? "Salvar" : "Criar"}
              </button>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3 lg:col-span-2">
            {questions.map((question) => (
              <div
                key={question.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      #{question.order}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                      {question.prompt}
                    </p>
                  </div>
                  <pre className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600 overflow-x-auto">
                    {JSON.stringify(question.weightsByArea)}
                  </pre>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionId(question.id);
                      setQuestionOrder(String(question.order));
                      setQuestionPrompt(question.prompt);
                      setQuestionWeightsText(
                        JSON.stringify(question.weightsByArea, null, 2),
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete("question", question.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "tracks" && (
        <section className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleTrackSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1"
          >
            <h2 className="text-base font-bold text-slate-900">
              {editingTrackId ? "Editar Trilha" : "Nova Trilha"}
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                MacroÁrea
              </label>
              <select
                required
                value={trackMacroId}
                onChange={(e) => setTrackMacroId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {macroAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Título
              </label>
              <input
                type="text"
                required
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Descrição
              </label>
              <textarea
                required
                rows={3}
                value={trackDescription}
                onChange={(e) => setTrackDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={trackPublished}
                onChange={(e) => setTrackPublished(e.target.checked)}
                className="rounded border-slate-300"
              />
              Publicada para estudantes
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {editingTrackId ? "Salvar" : "Criar"}
              </button>
              {editingTrackId && (
                <button
                  type="button"
                  onClick={resetTrackForm}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3 lg:col-span-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{track.title}</h3>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {track.macroArea.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        track.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {track.published ? "Publicada" : "Rascunho"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{track.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrackId(track.id);
                      setTrackMacroId(track.macroAreaId);
                      setTrackTitle(track.title);
                      setTrackDescription(track.description);
                      setTrackPublished(track.published);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete("track", track.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "courseItems" && (
        <section className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleCourseSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1"
          >
            <h2 className="text-base font-bold text-slate-900">
              {editingCourseId ? "Editar Curso Externo" : "Novo Curso Externo"}
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Trilha
              </label>
              <select
                required
                value={courseTrackId}
                onChange={(e) => setCourseTrackId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Título do Curso
              </label>
              <input
                type="text"
                required
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Provedor
              </label>
              <input
                type="text"
                required
                value={courseProvider}
                onChange={(e) => setCourseProvider(e.target.value)}
                placeholder="Ex: Fundação Bradesco, Khan Academy"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                URL Externa
              </label>
              <input
                type="url"
                required
                value={courseUrl}
                onChange={(e) => setCourseUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Ordem na Trilha
              </label>
              <input
                type="number"
                min={1}
                required
                value={courseOrder}
                onChange={(e) => setCourseOrder(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {editingCourseId ? "Salvar" : "Adicionar"}
              </button>
              {editingCourseId && (
                <button
                  type="button"
                  onClick={resetCourseForm}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3 lg:col-span-2">
            {courseItems.map((course) => (
              <div
                key={course.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      #{course.order}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{course.title}</h3>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {course.track.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Provedor: <span className="font-semibold">{course.providerName}</span>
                  </p>
                  <a
                    href={course.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                  >
                    <span>{course.externalUrl}</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourseId(course.id);
                      setCourseTrackId(course.trackId);
                      setCourseTitle(course.title);
                      setCourseProvider(course.providerName);
                      setCourseUrl(course.externalUrl);
                      setCourseOrder(String(course.order));
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete("courseItem", course.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "challenges" && (
        <section className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleChallengeSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1"
          >
            <h2 className="text-base font-bold text-slate-900">
              {editingChallengeId ? "Editar Desafio" : "Novo Desafio Prático"}
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                MacroÁrea
              </label>
              <select
                required
                value={challengeMacroId}
                onChange={(e) => setChallengeMacroId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {macroAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Título
              </label>
              <input
                type="text"
                required
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Descrição
              </label>
              <textarea
                required
                rows={4}
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={challengePublished}
                onChange={(e) => setChallengePublished(e.target.checked)}
                className="rounded border-slate-300"
              />
              Publicado para estudantes
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {editingChallengeId ? "Salvar" : "Criar"}
              </button>
              {editingChallengeId && (
                <button
                  type="button"
                  onClick={resetChallengeForm}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3 lg:col-span-2">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {challenge.title}
                    </h3>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {challenge.macroArea.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        challenge.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {challenge.published ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {challenge.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChallengeId(challenge.id);
                      setChallengeMacroId(challenge.macroAreaId);
                      setChallengeTitle(challenge.title);
                      setChallengeDescription(challenge.description);
                      setChallengePublished(challenge.published);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete("challenge", challenge.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
