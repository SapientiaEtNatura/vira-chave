"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
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
} from "@/components/ui";
import type {
  AdminCourseItem,
  AdminTrack,
  PendingDelete,
  SendContentRequestFn,
} from "./types";

interface CoursesTabProps {
  courseItems: AdminCourseItem[];
  tracks: AdminTrack[];
  busy: boolean;
  checkingLinks: boolean;
  checkingCourseId: string | null;
  sendContentRequest: SendContentRequestFn;
  onCourseCreated: (item: AdminCourseItem) => void;
  onCourseUpdated: (item: AdminCourseItem) => void;
  onCheckLinks: (courseId?: string) => Promise<void>;
  onRequestDelete: (pending: PendingDelete) => void;
  onFeedback: (message: string) => void;
}

interface CourseFormSnapshot {
  trackId: string;
  title: string;
  providerName: string;
  externalUrl: string;
  order: string;
}

export function CoursesTab({
  courseItems,
  tracks,
  busy,
  checkingLinks,
  checkingCourseId,
  sendContentRequest,
  onCourseCreated,
  onCourseUpdated,
  onCheckLinks,
  onRequestDelete,
  onFeedback,
}: CoursesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrackId, setFilterTrackId] = useState("all");
  const [filterBrokenOnly, setFilterBrokenOnly] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [trackId, setTrackId] = useState(tracks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [providerName, setProviderName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [order, setOrder] = useState("1");
  const [initialSnapshot, setInitialSnapshot] = useState<CourseFormSnapshot>({
    trackId: tracks[0]?.id ?? "",
    title: "",
    providerName: "",
    externalUrl: "",
    order: "1",
  });

  const isDirty =
    drawerOpen &&
    (trackId !== initialSnapshot.trackId ||
      title !== initialSnapshot.title ||
      providerName !== initialSnapshot.providerName ||
      externalUrl !== initialSnapshot.externalUrl ||
      order !== initialSnapshot.order);

  const brokenCoursesCount = useMemo(
    () => courseItems.filter((item) => item.lastCheckOk === false).length,
    [courseItems],
  );

  const visibleCourseItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courseItems.filter((course) => {
      if (filterBrokenOnly && course.lastCheckOk !== false) {
        return false;
      }
      if (filterTrackId !== "all" && course.trackId !== filterTrackId) {
        return false;
      }
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        course.providerName.toLowerCase().includes(q) ||
        course.externalUrl.toLowerCase().includes(q) ||
        course.track.title.toLowerCase().includes(q)
      );
    });
  }, [courseItems, searchQuery, filterTrackId, filterBrokenOnly]);

  function openCreateDrawer() {
    const defaultTrackId =
      filterTrackId !== "all" ? filterTrackId : (tracks[0]?.id ?? "");
    const maxOrder = courseItems
      .filter((c) => c.trackId === defaultTrackId)
      .reduce((max, c) => Math.max(max, c.order), 0);
    const nextOrder = String(maxOrder + 1);

    setEditingId(null);
    setTrackId(defaultTrackId);
    setTitle("");
    setProviderName("");
    setExternalUrl("");
    setOrder(nextOrder);
    setInitialSnapshot({
      trackId: defaultTrackId,
      title: "",
      providerName: "",
      externalUrl: "",
      order: nextOrder,
    });
    setDrawerOpen(true);
  }

  function openEditDrawer(course: AdminCourseItem) {
    const nextOrder = String(course.order);
    setEditingId(course.id);
    setTrackId(course.trackId);
    setTitle(course.title);
    setProviderName(course.providerName);
    setExternalUrl(course.externalUrl);
    setOrder(nextOrder);
    setInitialSnapshot({
      trackId: course.trackId,
      title: course.title,
      providerName: course.providerName,
      externalUrl: course.externalUrl,
      order: nextOrder,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = await sendContentRequest<{ item: AdminCourseItem }>(
      editingId ? "PATCH" : "POST",
      editingId
        ? {
            kind: "courseItem",
            id: editingId,
            trackId,
            title,
            providerName,
            externalUrl,
            order: Number(order),
          }
        : {
            kind: "courseItem",
            trackId,
            title,
            providerName,
            externalUrl,
            order: Number(order),
          },
    );
    if (!payload?.item) return;

    if (editingId) {
      onCourseUpdated(payload.item);
      onFeedback("Curso externo atualizado.");
    } else {
      onCourseCreated(payload.item);
      onFeedback("Curso externo adicionado.");
    }
    closeDrawer();
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterTrackId("all");
    setFilterBrokenOnly(false);
  }

  const hasFilters =
    searchQuery.trim() !== "" || filterTrackId !== "all" || filterBrokenOnly;
  const formId = "course-drawer-form";

  return (
    <section
      id="panel-courseItems"
      role="tabpanel"
      aria-labelledby="tab-courseItems"
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px] sm:max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar curso, provedor ou URL..."
              aria-label="Buscar curso externo"
              className="min-h-11 pl-10"
            />
          </div>
          <Select
            value={filterTrackId}
            onChange={(e) => setFilterTrackId(e.target.value)}
            aria-label="Filtrar cursos por Trilha"
            className="min-h-11 sm:w-56"
          >
            <option value="all">Todas as Trilhas</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant={filterBrokenOnly ? "primary" : "outline"}
            size="sm"
            aria-pressed={filterBrokenOnly}
            leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
            onClick={() => setFilterBrokenOnly((current) => !current)}
            className="min-h-11 shrink-0"
          >
            Apenas com erro
            {brokenCoursesCount > 0 ? (
              <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-xs tabular-nums">
                {brokenCoursesCount}
              </span>
            ) : null}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={
              checkingLinks ||
              checkingCourseId !== null ||
              courseItems.length === 0
            }
            loading={checkingLinks}
            onClick={() => void onCheckLinks()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            {checkingLinks ? "Verificando..." : "Verificar links"}
          </Button>
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreateDrawer}
            className="min-h-11 shrink-0"
          >
            Novo Curso
          </Button>
        </div>
      </div>

      {brokenCoursesCount > 0 ? (
        <Alert variant="warning">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="tabular-nums">
              {brokenCoursesCount}{" "}
              {brokenCoursesCount === 1
                ? "curso apresentou erro na última verificação de link."
                : "cursos apresentaram erro na última verificação de link."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setFilterBrokenOnly((current) => !current)}
            >
              {filterBrokenOnly ? "Limpar filtro" : "Filtrar apenas com erro"}
            </Button>
          </div>
        </Alert>
      ) : null}

      {courseItems.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Nenhum curso externo cadastrado"
          description="Adicione cursos externos gratuitos às trilhas de aprendizagem."
          action={
            <Button
              type="button"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreateDrawer}
              className="min-h-11"
            >
              Novo Curso
            </Button>
          }
        />
      ) : visibleCourseItems.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={
            filterBrokenOnly && !searchQuery.trim() && filterTrackId === "all"
              ? "Nenhum curso com erro de link"
              : "Nenhum curso encontrado"
          }
          description={
            filterBrokenOnly && !searchQuery.trim() && filterTrackId === "all"
              ? "Todos os cursos verificados estão online ou ainda não foram verificados."
              : "Nenhum curso corresponde aos filtros aplicados."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="min-h-11"
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleCourseItems.map((course) => {
            const statusIndicator =
              course.lastCheckOk === true ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--status-success-ink)]">
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  Online
                </span>
              ) : course.lastCheckOk === false ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--status-danger-ink)]">
                  <span
                    className="h-2 w-2 rounded-full bg-rose-500"
                    aria-hidden="true"
                  />
                  {`Erro ${course.lastCheckStatus ?? "conexão"}`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)]">
                  <span
                    className="h-2 w-2 rounded-full bg-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  Não verificado
                </span>
              );

            return (
              <Card
                key={course.id}
                padding="md"
                className="flex flex-col gap-3 rounded-2xl sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--ink-muted)] tabular-nums">
                      #{course.order}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                      {course.title}
                    </h3>
                    <Badge variant="brand">{course.track.title}</Badge>
                    {statusIndicator}
                  </div>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    Provedor:{" "}
                    <span className="font-semibold text-[var(--ink-primary)]">
                      {course.providerName}
                    </span>
                  </p>
                  <a
                    href={course.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 break-all text-xs text-[var(--brand-primary)] hover:underline"
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
                    aria-label="Verificar link"
                    title="Verificar link"
                    className="min-h-11 min-w-11 px-0"
                    disabled={checkingLinks || checkingCourseId === course.id}
                    loading={checkingCourseId === course.id}
                    onClick={() => void onCheckLinks(course.id)}
                  >
                    {checkingCourseId === course.id ? null : (
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEditDrawer(course)}
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
            );
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? "Editar curso externo" : "Novo curso externo"}
        subtitle="Informe a trilha, provedor, URL externa e ordem de exibição."
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
              {editingId ? "Salvar alterações" : "Adicionar curso"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <FormField id="course-track" label="Trilha" required>
            <Select
              required
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>

          <FormField id="course-provider" label="Provedor" required>
            <Input
              type="text"
              required
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Ex: Fundação Bradesco, Khan Academy"
            />
          </FormField>

          <FormField id="course-url" label="URL externa" required>
            <Input
              type="url"
              required
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
            />
          </FormField>

          <FormField id="course-order" label="Ordem na trilha" required>
            <Input
              type="number"
              min={1}
              required
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="tabular-nums"
            />
          </FormField>
        </form>
      </Drawer>
    </section>
  );
}
