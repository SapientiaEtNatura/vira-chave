"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  FormField,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type {
  AdminMacroArea,
  AdminTrack,
  PendingDelete,
  SendContentRequestFn,
} from "./types";

interface TracksTabProps {
  tracks: AdminTrack[];
  macroAreas: AdminMacroArea[];
  busy: boolean;
  serverError?: string | null;
  sendContentRequest: SendContentRequestFn;
  onTrackCreated: (item: AdminTrack) => void;
  onTrackUpdated: (item: AdminTrack) => void;
  onRequestDelete: (pending: PendingDelete) => void;
  onFeedback: (message: string) => void;
}

interface TrackFormSnapshot {
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
}

export function TracksTab({
  tracks,
  macroAreas,
  busy,
  serverError,
  sendContentRequest,
  onTrackCreated,
  onTrackUpdated,
  onRequestDelete,
  onFeedback,
}: TracksTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMacroId, setFilterMacroId] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [macroAreaId, setMacroAreaId] = useState(macroAreas[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [initialSnapshot, setInitialSnapshot] = useState<TrackFormSnapshot>({
    macroAreaId: macroAreas[0]?.id ?? "",
    title: "",
    description: "",
    published: true,
  });

  const isDirty =
    drawerOpen &&
    (macroAreaId !== initialSnapshot.macroAreaId ||
      title !== initialSnapshot.title ||
      description !== initialSnapshot.description ||
      published !== initialSnapshot.published);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tracks.filter((track) => {
      const matchesText =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.description.toLowerCase().includes(q) ||
        track.macroArea.name.toLowerCase().includes(q);
      const matchesMacro =
        filterMacroId === "all" || track.macroAreaId === filterMacroId;
      return matchesText && matchesMacro;
    });
  }, [tracks, searchQuery, filterMacroId]);

  function openCreateDrawer() {
    const defaultMacroId =
      filterMacroId !== "all" ? filterMacroId : (macroAreas[0]?.id ?? "");
    setEditingId(null);
    setMacroAreaId(defaultMacroId);
    setTitle("");
    setDescription("");
    setPublished(true);
    setInitialSnapshot({
      macroAreaId: defaultMacroId,
      title: "",
      description: "",
      published: true,
    });
    setDrawerOpen(true);
  }

  function openEditDrawer(track: AdminTrack) {
    setEditingId(track.id);
    setMacroAreaId(track.macroAreaId);
    setTitle(track.title);
    setDescription(track.description);
    setPublished(track.published);
    setInitialSnapshot({
      macroAreaId: track.macroAreaId,
      title: track.title,
      description: track.description,
      published: track.published,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminTrack }>(
      editingId ? "PATCH" : "POST",
      editingId
        ? {
            kind: "track",
            id: editingId,
            macroAreaId,
            title,
            description,
            published,
          }
        : {
            kind: "track",
            macroAreaId,
            title,
            description,
            published,
          },
    );
    if (!payload?.item) return;

    if (editingId) {
      onTrackUpdated(payload.item);
      onFeedback("Trilha atualizada.");
    } else {
      onTrackCreated(payload.item);
      onFeedback("Trilha criada.");
    }
    closeDrawer();
  }

  const hasFilters = searchQuery.trim() !== "" || filterMacroId !== "all";
  const formId = "track-drawer-form";

  return (
    <section
      id="panel-tracks"
      role="tabpanel"
      aria-labelledby="tab-tracks"
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar trilha por título ou descrição..."
              aria-label="Buscar trilha"
              className="min-h-11 pl-10"
            />
          </div>
          <Select
            value={filterMacroId}
            onChange={(e) => setFilterMacroId(e.target.value)}
            aria-label="Filtrar trilhas por MacroÁrea"
            className="min-h-11 sm:w-56"
          >
            <option value="all">Todas as MacroÁreas</option>
            {macroAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openCreateDrawer}
          className="min-h-11 shrink-0"
        >
          Nova Trilha
        </Button>
      </div>

      {tracks.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Nenhuma trilha cadastrada"
          description="Crie uma trilha de aprendizagem para vincular cursos externos na etapa Aprender."
          action={
            <Button
              type="button"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreateDrawer}
              className="min-h-11"
            >
              Nova Trilha
            </Button>
          }
        />
      ) : filteredTracks.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nenhuma trilha encontrada"
          description="Nenhuma trilha corresponde aos filtros aplicados."
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterMacroId("all");
                }}
                className="min-h-11"
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              padding="md"
              className="flex flex-col justify-between gap-4"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                    {track.title}
                  </h3>
                  <Badge variant="brand">{track.macroArea.name}</Badge>
                  <Badge variant={track.published ? "success" : "neutral"}>
                    {track.published ? "Publicada" : "Rascunho"}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                  {track.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => openEditDrawer(track)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="min-h-11"
                  disabled={busy}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() =>
                    onRequestDelete({
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
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? "Editar trilha" : "Nova trilha"}
        subtitle="Associe a trilha a uma MacroÁrea e defina se já está visível para estudantes."
        isDirty={isDirty}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDrawer}
              disabled={busy}
              className="min-h-11"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="primary"
              loading={busy}
              className="min-h-11"
            >
              {editingId ? "Salvar alterações" : "Criar trilha"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {serverError ? <Alert variant="danger">{serverError}</Alert> : null}
          <FormField id="track-macro-area" label="Macroárea" required>
            <Select
              required
              value={macroAreaId}
              onChange={(e) => setMacroAreaId(e.target.value)}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>

          <FormField id="track-description" label="Descrição" required>
            <Textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <label
            htmlFor="track-published"
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-[var(--ink-secondary)]"
          >
            <input
              id="track-published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
            />
            <span>Publicada para estudantes</span>
          </label>
        </form>
      </Drawer>
    </section>
  );
}
