"use client";

import { useState } from "react";
import { BookOpen, Compass, Layers, Rocket, Sparkles } from "lucide-react";
import { Alert, ConfirmDialog } from "@/components/ui";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import { ChallengesTab } from "./content/ChallengesTab";
import { CoursesTab } from "./content/CoursesTab";
import { MacroAreasTab } from "./content/MacroAreasTab";
import { QuestionsTab } from "./content/QuestionsTab";
import { TracksTab } from "./content/TracksTab";
import type {
  AdminChallenge,
  AdminCourseItem,
  AdminDiscoveryQuestion,
  AdminMacroArea,
  AdminTrack,
  ContentTab,
  PendingDelete,
} from "./content/types";

export type {
  AdminChallenge,
  AdminCourseItem,
  AdminDiscoveryQuestion,
  AdminMacroArea,
  AdminTrack,
} from "./content/types";

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
  const [tabDirection, setTabDirection] = useState<"right" | "left">("right");
  const {
    containerRef: tabListRef,
    setItemRef: setTabRef,
    indicator,
  } = useSlidingIndicator(activeTab);

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
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [checkingCourseId, setCheckingCourseId] = useState<string | null>(null);

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

  function handleMacroAreaCreated(item: AdminMacroArea) {
    setMacroAreas((prev) => [...prev, item]);
  }

  function handleMacroAreaUpdated(item: AdminMacroArea) {
    setMacroAreas((prev) => prev.map((m) => (m.id === item.id ? item : m)));
    setTracks((prev) =>
      prev.map((t) =>
        t.macroAreaId === item.id
          ? {
              ...t,
              macroArea: {
                id: item.id,
                name: item.name,
                slug: item.slug,
              },
            }
          : t,
      ),
    );
    setChallenges((prev) =>
      prev.map((c) =>
        c.macroAreaId === item.id
          ? {
              ...c,
              macroArea: {
                id: item.id,
                name: item.name,
                slug: item.slug,
              },
            }
          : c,
      ),
    );
  }

  function handleQuestionSaved(item: AdminDiscoveryQuestion, isEdit: boolean) {
    setQuestions((prev) => {
      const next = isEdit
        ? prev.map((q) => (q.id === item.id ? item : q))
        : [...prev, item];
      return [...next].sort((a, b) => a.order - b.order);
    });
  }

  function handleTrackCreated(item: AdminTrack) {
    setTracks((prev) => [...prev, item]);
  }

  function handleTrackUpdated(item: AdminTrack) {
    setTracks((prev) => prev.map((t) => (t.id === item.id ? item : t)));
    setCourseItems((prev) =>
      prev.map((c) =>
        c.trackId === item.id
          ? {
              ...c,
              track: { id: item.id, title: item.title },
            }
          : c,
      ),
    );
  }

  function handleCourseCreated(item: AdminCourseItem) {
    setCourseItems((prev) => [...prev, item]);
  }

  function handleCourseUpdated(item: AdminCourseItem) {
    setCourseItems((prev) => prev.map((c) => (c.id === item.id ? item : c)));
  }

  function handleChallengeCreated(item: AdminChallenge) {
    setChallenges((prev) => [...prev, item]);
  }

  function handleChallengeUpdated(item: AdminChallenge) {
    setChallenges((prev) => prev.map((c) => (c.id === item.id ? item : c)));
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

  async function handleCheckLinks(courseId?: string) {
    clearMessages();
    if (courseId) {
      setCheckingCourseId(courseId);
    } else {
      setCheckingLinks(true);
    }

    try {
      const response = await fetch("/api/admin/content/check-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseId ? { courseId } : {}),
      });

      const payload = (await response.json()) as {
        checkedCount?: number;
        okCount?: number;
        brokenCount?: number;
        results?: Array<{
          id: string;
          lastCheckedAt: string;
          lastCheckOk: boolean;
          lastCheckStatus: number | null;
        }>;
        error?: string;
      };

      if (!response.ok || !payload.results) {
        setError(payload.error ?? "Não foi possível verificar os links.");
        return;
      }

      const byId = new Map(payload.results.map((item) => [item.id, item]));
      setCourseItems((prev) =>
        prev.map((course) => {
          const updated = byId.get(course.id);
          if (!updated) return course;
          return {
            ...course,
            lastCheckedAt: updated.lastCheckedAt,
            lastCheckOk: updated.lastCheckOk,
            lastCheckStatus: updated.lastCheckStatus,
          };
        }),
      );

      if (courseId) {
        const single = payload.results[0];
        setFeedback(
          single?.lastCheckOk
            ? "Link verificado: curso online."
            : `Link verificado com erro (${single?.lastCheckStatus ?? "conexão"}).`,
        );
      } else {
        setFeedback(
          `Verificação concluída: ${payload.okCount ?? 0} online, ${payload.brokenCount ?? 0} com erro.`,
        );
      }
    } catch {
      setError("Erro de conexão ao verificar os links dos cursos.");
    } finally {
      setCheckingLinks(false);
      setCheckingCourseId(null);
    }
  }

  const tabs: {
    id: ContentTab;
    label: string;
    count: number;
    icon: typeof Layers;
  }[] = [
    {
      id: "macroAreas",
      label: "Macroáreas",
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

  function selectTabByIndex(nextIndex: number) {
    const normalized = (nextIndex + tabs.length) % tabs.length;
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextTab = tabs[normalized];
    if (!nextTab) return;
    setTabDirection(normalized >= currentIndex ? "right" : "left");
    clearMessages();
    setActiveTab(nextTab.id);
    const el = document.getElementById(`tab-${nextTab.id}`);
    el?.focus();
  }

  function getDeleteDescription(target: PendingDelete | null): string | undefined {
    if (!target) return undefined;
    if (target.kind === "macroArea") {
      const linkedTracks = tracks.filter((t) => t.macroAreaId === target.id);
      const linkedTrackIds = new Set(linkedTracks.map((t) => t.id));
      const linkedCoursesCount = courseItems.filter((c) =>
        linkedTrackIds.has(c.trackId),
      ).length;
      const linkedChallengesCount = challenges.filter(
        (c) => c.macroAreaId === target.id,
      ).length;
      const impactParts = [
        linkedTracks.length > 0
          ? `${linkedTracks.length} ${linkedTracks.length === 1 ? "trilha" : "trilhas"}`
          : null,
        linkedCoursesCount > 0
          ? `${linkedCoursesCount} ${linkedCoursesCount === 1 ? "curso" : "cursos"}`
          : null,
        linkedChallengesCount > 0
          ? `${linkedChallengesCount} ${linkedChallengesCount === 1 ? "desafio" : "desafios"}`
          : null,
      ].filter(Boolean);
      return impactParts.length > 0
        ? `Tem certeza que deseja excluir "${target.label}"? Isso também removerá ${impactParts.join(", ")}.`
        : `Tem certeza que deseja excluir a macroárea "${target.label}"?`;
    }
    if (target.kind === "track") {
      const linkedCoursesCount = courseItems.filter(
        (c) => c.trackId === target.id,
      ).length;
      return linkedCoursesCount > 0
        ? `Tem certeza que deseja excluir a trilha "${target.label}"? Isso também removerá ${linkedCoursesCount} ${linkedCoursesCount === 1 ? "curso vinculado" : "cursos vinculados"}.`
        : `Tem certeza que deseja excluir a trilha "${target.label}"?`;
    }
    return `Tem certeza que deseja excluir "${target.label}"? Esta ação não pode ser desfeita.`;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-1">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Seções de curadoria de conteúdo"
          onKeyDown={(event) => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            if (event.key === "ArrowRight") {
              event.preventDefault();
              selectTabByIndex(currentIndex + 1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              selectTabByIndex(currentIndex - 1);
            } else if (event.key === "Home") {
              event.preventDefault();
              selectTabByIndex(0);
            } else if (event.key === "End") {
              event.preventDefault();
              selectTabByIndex(tabs.length - 1);
            }
          }}
          className="relative inline-flex min-w-max flex-nowrap items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1"
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
          {tabs.map((tab, tabIndex) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={setTabRef(tab.id)}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    (t) => t.id === activeTab,
                  );
                  setTabDirection(tabIndex >= currentIndex ? "right" : "left");
                  clearMessages();
                  setActiveTab(tab.id);
                }}
                className={`relative z-10 inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-surface)]/70 hover:text-[var(--ink-primary)]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums transition-colors duration-200 ${
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
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <div
        key={activeTab}
        className={
          tabDirection === "right" ? "animate-tab-right" : "animate-tab-left"
        }
      >
        {activeTab === "macroAreas" && (
          <MacroAreasTab
            macroAreas={macroAreas}
            busy={busy}
            serverError={error}
            sendContentRequest={sendContentRequest}
            onMacroAreaCreated={handleMacroAreaCreated}
            onMacroAreaUpdated={handleMacroAreaUpdated}
            onRequestDelete={setPendingDelete}
            onFeedback={(msg) => setFeedback(msg)}
          />
        )}

        {activeTab === "questions" && (
          <QuestionsTab
            questions={questions}
            macroAreas={macroAreas}
            busy={busy}
            serverError={error}
            sendContentRequest={sendContentRequest}
            onQuestionSaved={handleQuestionSaved}
            onRequestDelete={setPendingDelete}
            onValidationError={(msg) => setError(msg)}
            onFeedback={(msg) => setFeedback(msg)}
          />
        )}

        {activeTab === "tracks" && (
          <TracksTab
            tracks={tracks}
            macroAreas={macroAreas}
            busy={busy}
            serverError={error}
            sendContentRequest={sendContentRequest}
            onTrackCreated={handleTrackCreated}
            onTrackUpdated={handleTrackUpdated}
            onRequestDelete={setPendingDelete}
            onFeedback={(msg) => setFeedback(msg)}
          />
        )}

        {activeTab === "courseItems" && (
          <CoursesTab
            courseItems={courseItems}
            tracks={tracks}
            busy={busy}
            serverError={error}
            checkingLinks={checkingLinks}
            checkingCourseId={checkingCourseId}
            sendContentRequest={sendContentRequest}
            onCourseCreated={handleCourseCreated}
            onCourseUpdated={handleCourseUpdated}
            onCheckLinks={handleCheckLinks}
            onRequestDelete={setPendingDelete}
            onFeedback={(msg) => setFeedback(msg)}
          />
        )}

        {activeTab === "challenges" && (
          <ChallengesTab
            challenges={challenges}
            macroAreas={macroAreas}
            busy={busy}
            serverError={error}
            sendContentRequest={sendContentRequest}
            onChallengeCreated={handleChallengeCreated}
            onChallengeUpdated={handleChallengeUpdated}
            onRequestDelete={setPendingDelete}
            onFeedback={(msg) => setFeedback(msg)}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Confirmar exclusão"
        description={getDeleteDescription(pendingDelete)}
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
