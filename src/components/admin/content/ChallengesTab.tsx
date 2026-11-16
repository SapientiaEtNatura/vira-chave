"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Rocket, Search, Trash2 } from "lucide-react";
import {
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
  AdminChallenge,
  AdminMacroArea,
  PendingDelete,
  SendContentRequestFn,
} from "./types";

interface ChallengesTabProps {
  challenges: AdminChallenge[];
  macroAreas: AdminMacroArea[];
  busy: boolean;
  sendContentRequest: SendContentRequestFn;
  onChallengeCreated: (item: AdminChallenge) => void;
  onChallengeUpdated: (item: AdminChallenge) => void;
  onRequestDelete: (pending: PendingDelete) => void;
  onFeedback: (message: string) => void;
}

interface ChallengeFormSnapshot {
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
}

export function ChallengesTab({
  challenges,
  macroAreas,
  busy,
  sendContentRequest,
  onChallengeCreated,
  onChallengeUpdated,
  onRequestDelete,
  onFeedback,
}: ChallengesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMacroId, setFilterMacroId] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [macroAreaId, setMacroAreaId] = useState(macroAreas[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [initialSnapshot, setInitialSnapshot] =
    useState<ChallengeFormSnapshot>({
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

  const filteredChallenges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return challenges.filter((challenge) => {
      const matchesText =
        !q ||
        challenge.title.toLowerCase().includes(q) ||
        challenge.description.toLowerCase().includes(q) ||
        challenge.macroArea.name.toLowerCase().includes(q);
      const matchesMacro =
        filterMacroId === "all" || challenge.macroAreaId === filterMacroId;
      return matchesText && matchesMacro;
    });
  }, [challenges, searchQuery, filterMacroId]);

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

  function openEditDrawer(challenge: AdminChallenge) {
    setEditingId(challenge.id);
    setMacroAreaId(challenge.macroAreaId);
    setTitle(challenge.title);
    setDescription(challenge.description);
    setPublished(challenge.published);
    setInitialSnapshot({
      macroAreaId: challenge.macroAreaId,
      title: challenge.title,
      description: challenge.description,
      published: challenge.published,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminChallenge }>(
      editingId ? "PATCH" : "POST",
      editingId
        ? {
            kind: "challenge",
            id: editingId,
            macroAreaId,
            title,
            description,
            published,
          }
        : {
            kind: "challenge",
            macroAreaId,
            title,
            description,
            published,
          },
    );
    if (!payload?.item) return;

    if (editingId) {
      onChallengeUpdated(payload.item);
      onFeedback("Desafio atualizado.");
    } else {
      onChallengeCreated(payload.item);
      onFeedback("Desafio criado.");
    }
    closeDrawer();
  }

  const hasFilters = searchQuery.trim() !== "" || filterMacroId !== "all";
  const formId = "challenge-drawer-form";

  return (
    <section
      id="panel-challenges"
      role="tabpanel"
      aria-labelledby="tab-challenges"
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
              placeholder="Buscar desafio por título ou descrição..."
              aria-label="Buscar desafio"
              className="min-h-11 pl-10"
            />
          </div>
          <Select
            value={filterMacroId}
            onChange={(e) => setFilterMacroId(e.target.value)}
            aria-label="Filtrar desafios por MacroÁrea"
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
          Novo Desafio
        </Button>
      </div>

      {challenges.length === 0 ? (
        <EmptyState
          icon={<Rocket className="h-6 w-6" />}
          title="Nenhum desafio cadastrado"
          description="Crie desafios práticos para a etapa Experimentar dos estudantes."
          action={
            <Button
              type="button"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreateDrawer}
              className="min-h-11"
            >
              Novo Desafio
            </Button>
          }
        />
      ) : filteredChallenges.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nenhum desafio encontrado"
          description="Nenhum desafio corresponde aos filtros aplicados."
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
          {filteredChallenges.map((challenge) => (
            <Card
              key={challenge.id}
              padding="md"
              className="flex flex-col justify-between gap-4"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                    {challenge.title}
                  </h3>
                  <Badge variant="brand">{challenge.macroArea.name}</Badge>
                  <Badge variant={challenge.published ? "success" : "neutral"}>
                    {challenge.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                  {challenge.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => openEditDrawer(challenge)}
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
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? "Editar desafio" : "Novo desafio prático"}
        subtitle="Configure a MacroÁrea, título, descrição e publicação do desafio."
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
              {editingId ? "Salvar alterações" : "Criar desafio"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <FormField id="challenge-macro-area" label="MacroÁrea" required>
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

          <FormField id="challenge-title" label="Título" required>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>

          <FormField id="challenge-description" label="Descrição" required>
            <Textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <label
            htmlFor="challenge-published"
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-[var(--ink-secondary)]"
          >
            <input
              id="challenge-published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
            />
            <span>Publicado para estudantes</span>
          </label>
        </form>
      </Drawer>
    </section>
  );
}
