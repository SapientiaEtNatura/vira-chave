"use client";

import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  FormField,
  Input,
  Textarea,
} from "@/components/ui";
import type {
  AdminMacroArea,
  PendingDelete,
  SendContentRequestFn,
} from "./types";

interface MacroAreasTabProps {
  macroAreas: AdminMacroArea[];
  busy: boolean;
  sendContentRequest: SendContentRequestFn;
  onMacroAreaCreated: (item: AdminMacroArea) => void;
  onMacroAreaUpdated: (item: AdminMacroArea) => void;
  onRequestDelete: (pending: PendingDelete) => void;
  onFeedback: (message: string) => void;
}

interface MacroFormSnapshot {
  name: string;
  slug: string;
  description: string;
}

const EMPTY_SNAPSHOT: MacroFormSnapshot = {
  name: "",
  slug: "",
  description: "",
};

export function MacroAreasTab({
  macroAreas,
  busy,
  sendContentRequest,
  onMacroAreaCreated,
  onMacroAreaUpdated,
  onRequestDelete,
  onFeedback,
}: MacroAreasTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [initialSnapshot, setInitialSnapshot] =
    useState<MacroFormSnapshot>(EMPTY_SNAPSHOT);

  const isDirty =
    drawerOpen &&
    (name !== initialSnapshot.name ||
      slug !== initialSnapshot.slug ||
      description !== initialSnapshot.description);

  const filteredMacroAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return macroAreas;
    return macroAreas.filter(
      (area) =>
        area.name.toLowerCase().includes(q) ||
        area.slug.toLowerCase().includes(q) ||
        area.description.toLowerCase().includes(q),
    );
  }, [macroAreas, searchQuery]);

  function openCreateDrawer() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setInitialSnapshot(EMPTY_SNAPSHOT);
    setDrawerOpen(true);
  }

  function openEditDrawer(area: AdminMacroArea) {
    setEditingId(area.id);
    setName(area.name);
    setSlug(area.slug);
    setDescription(area.description);
    setInitialSnapshot({
      name: area.name,
      slug: area.slug,
      description: area.description,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminMacroArea }>(
      editingId ? "PATCH" : "POST",
      editingId
        ? {
            kind: "macroArea",
            id: editingId,
            name,
            slug,
            description,
          }
        : {
            kind: "macroArea",
            name,
            slug,
            description,
          },
    );
    if (!payload?.item) return;

    if (editingId) {
      onMacroAreaUpdated(payload.item);
      onFeedback("Macroárea atualizada.");
    } else {
      onMacroAreaCreated(payload.item);
      onFeedback("Macroárea criada.");
    }
    closeDrawer();
  }

  const formId = "macro-area-drawer-form";

  return (
    <section
      id="panel-macroAreas"
      role="tabpanel"
      aria-labelledby="tab-macroAreas"
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar MacroÁrea por nome, slug ou descrição..."
            aria-label="Buscar MacroÁrea"
            className="min-h-11 pl-10"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openCreateDrawer}
          className="min-h-11 shrink-0"
        >
          Nova MacroÁrea
        </Button>
      </div>

      {macroAreas.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Nenhuma MacroÁrea cadastrada"
          description="Crie a primeira MacroÁrea para organizar perguntas, trilhas e desafios."
          action={
            <Button
              type="button"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreateDrawer}
              className="min-h-11"
            >
              Nova MacroÁrea
            </Button>
          }
        />
      ) : filteredMacroAreas.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nenhuma MacroÁrea encontrada"
          description="Nenhum registro corresponde à busca atual."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="min-h-11"
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMacroAreas.map((area) => (
            <Card
              key={area.id}
              padding="md"
              className="flex flex-col justify-between gap-4"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                    {area.name}
                  </h3>
                  <Badge variant="neutral" className="font-mono">
                    {area.slug}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                  {area.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => openEditDrawer(area)}
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
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? "Editar MacroÁrea" : "Nova MacroÁrea"}
        subtitle="Defina o nome, identificador (slug) e descrição da área temática."
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
              {editingId ? "Salvar alterações" : "Criar MacroÁrea"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <FormField id="macro-name" label="Nome" required>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tecnologia e Dados"
            />
          </FormField>

          <FormField id="macro-slug" label="Slug" required>
            <Input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tecnologia-dados"
            />
          </FormField>

          <FormField id="macro-description" label="Descrição" required>
            <Textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </form>
      </Drawer>
    </section>
  );
}
