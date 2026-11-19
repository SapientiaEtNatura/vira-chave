"use client";

import { useMemo, useState } from "react";
import { Compass, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import type { DiscoveryQuestionOption } from "@/lib/discovery/types";
import {
  buildWeightsState,
  type AdminDiscoveryQuestion,
  type AdminMacroArea,
  type PendingDelete,
  type SendContentRequestFn,
} from "./types";

interface QuestionsTabProps {
  questions: AdminDiscoveryQuestion[];
  macroAreas: AdminMacroArea[];
  busy: boolean;
  sendContentRequest: SendContentRequestFn;
  onQuestionSaved: (item: AdminDiscoveryQuestion, isEdit: boolean) => void;
  onRequestDelete: (pending: PendingDelete) => void;
  onValidationError: (message: string) => void;
  onFeedback: (message: string) => void;
}

interface OptionDraft {
  id: string;
  label: string;
  weights: Record<string, string>;
}

interface QuestionFormSnapshot {
  order: string;
  prompt: string;
  options: OptionDraft[];
}

const OPTION_ID_POOL = ["a", "b", "c", "d"] as const;

function nextOptionId(existing: OptionDraft[]): string {
  const used = new Set(existing.map((o) => o.id));
  for (const candidate of OPTION_ID_POOL) {
    if (!used.has(candidate)) return candidate;
  }
  return `opt-${existing.length + 1}`;
}

function cloneOptions(options: OptionDraft[]): OptionDraft[] {
  return options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    weights: { ...opt.weights },
  }));
}

function buildDefaultOptions(macroAreas: AdminMacroArea[]): OptionDraft[] {
  return [
    { id: "a", label: "", weights: buildWeightsState(macroAreas) },
    { id: "b", label: "", weights: buildWeightsState(macroAreas) },
  ];
}

function buildEditOptions(
  question: AdminDiscoveryQuestion,
  macroAreas: AdminMacroArea[],
): OptionDraft[] {
  const drafts: OptionDraft[] = question.options.slice(0, 4).map((opt) => ({
    id: opt.id,
    label: opt.label,
    weights: buildWeightsState(macroAreas, opt.weightsByArea),
  }));

  while (drafts.length < 2) {
    drafts.push({
      id: nextOptionId(drafts),
      label: "",
      weights: buildWeightsState(macroAreas),
    });
  }

  return drafts;
}

function areWeightsEqual(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? "0") !== (b[key] ?? "0")) {
      return false;
    }
  }
  return true;
}

function areOptionsEqual(a: OptionDraft[], b: OptionDraft[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (opt, index) =>
      opt.id === b[index].id &&
      opt.label === b[index].label &&
      areWeightsEqual(opt.weights, b[index].weights),
  );
}

export function QuestionsTab({
  questions,
  macroAreas,
  busy,
  sendContentRequest,
  onQuestionSaved,
  onRequestDelete,
  onValidationError,
  onFeedback,
}: QuestionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMacroSlug, setFilterMacroSlug] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [order, setOrder] = useState("1");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>(() =>
    buildDefaultOptions(macroAreas),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<QuestionFormSnapshot>({
    order: "1",
    prompt: "",
    options: buildDefaultOptions(macroAreas),
  });

  const macroAreaNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const area of macroAreas) {
      map.set(area.slug, area.name);
    }
    return map;
  }, [macroAreas]);

  const knownSlugs = useMemo(
    () => new Set(macroAreas.map((area) => area.slug)),
    [macroAreas],
  );

  const isDirty =
    drawerOpen &&
    (order !== initialSnapshot.order ||
      prompt !== initialSnapshot.prompt ||
      !areOptionsEqual(options, initialSnapshot.options));

  const filteredQuestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesText =
        !q ||
        question.prompt.toLowerCase().includes(q) ||
        `#${question.order}`.includes(q);
      const matchesMacro =
        filterMacroSlug === "all" ||
        (question.weightsByArea[filterMacroSlug] ?? 0) > 0;
      return matchesText && matchesMacro;
    });
  }, [questions, searchQuery, filterMacroSlug]);

  function openCreateDrawer() {
    const maxOrder = questions.reduce(
      (max, item) => Math.max(max, item.order),
      0,
    );
    const nextOrder = String(maxOrder + 1);
    const initialOptions = buildDefaultOptions(macroAreas);
    setEditingId(null);
    setOrder(nextOrder);
    setPrompt("");
    setOptions(initialOptions);
    setFormError(null);
    setInitialSnapshot({
      order: nextOrder,
      prompt: "",
      options: cloneOptions(initialOptions),
    });
    setDrawerOpen(true);
  }

  function openEditDrawer(question: AdminDiscoveryQuestion) {
    const nextOrder = String(question.order);
    const editOptions = buildEditOptions(question, macroAreas);
    setEditingId(question.id);
    setOrder(nextOrder);
    setPrompt(question.prompt);
    setOptions(editOptions);
    setFormError(null);
    setInitialSnapshot({
      order: nextOrder,
      prompt: question.prompt,
      options: cloneOptions(editOptions),
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  function addOption() {
    if (options.length >= 4) return;
    setFormError(null);
    setOptions((prev) => [
      ...prev,
      {
        id: nextOptionId(prev),
        label: "",
        weights: buildWeightsState(macroAreas),
      },
    ]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setFormError(null);
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOptionLabel(index: number, value: string) {
    if (formError) setFormError(null);
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, label: value } : opt)),
    );
  }

  function updateOptionWeight(index: number, slug: string, value: string) {
    if (formError) setFormError(null);
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === index
          ? { ...opt, weights: { ...opt.weights, [slug]: value } }
          : opt,
      ),
    );
  }

  function failValidation(message: string) {
    setFormError(message);
    onValidationError(message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const parsedOrder = Number(order);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
      failValidation("A ordem da pergunta deve ser um número inteiro maior que zero.");
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 5 || trimmedPrompt.length > 400) {
      failValidation("O enunciado deve ter entre 5 e 400 caracteres.");
      return;
    }

    if (options.length < 2 || options.length > 4) {
      failValidation("Informe entre 2 e 4 opções situacionais.");
      return;
    }

    const seenIds = new Set<string>();
    const serializedOptions: DiscoveryQuestionOption[] = [];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const trimmedId = opt.id.trim();
      const trimmedLabel = opt.label.trim();

      if (!trimmedId || seenIds.has(trimmedId)) {
        failValidation(
          `A opção ${i + 1} precisa de um identificador único e não vazio.`,
        );
        return;
      }
      seenIds.add(trimmedId);

      if (trimmedLabel.length < 5 || trimmedLabel.length > 220) {
        failValidation(
          `A opção ${i + 1} deve ter texto entre 5 e 220 caracteres.`,
        );
        return;
      }

      const parsedWeights: Record<string, number> = {};
      for (const [slug, rawValue] of Object.entries(opt.weights)) {
        const trimmed = rawValue.trim();
        const numeric = trimmed === "" ? 0 : Number(trimmed);
        if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10) {
          failValidation(
            `Na opção ${i + 1}, o peso de "${macroAreaNameBySlug.get(slug) ?? slug}" deve ser um inteiro entre 0 e 10.`,
          );
          return;
        }
        parsedWeights[slug] = numeric;
      }

      const hasPositiveWeight = Object.values(parsedWeights).some(
        (weight) => weight > 0,
      );
      if (!hasPositiveWeight) {
        failValidation(
          `A opção ${i + 1} deve atribuir peso maior que zero a pelo menos uma MacroÁrea.`,
        );
        return;
      }

      serializedOptions.push({
        id: trimmedId,
        label: trimmedLabel,
        weightsByArea: parsedWeights,
      });
    }

    const payload = await sendContentRequest<{ item: AdminDiscoveryQuestion }>(
      editingId ? "PATCH" : "POST",
      editingId
        ? {
            kind: "question",
            id: editingId,
            prompt: trimmedPrompt,
            order: parsedOrder,
            options: serializedOptions,
          }
        : {
            kind: "question",
            prompt: trimmedPrompt,
            order: parsedOrder,
            options: serializedOptions,
          },
    );
    if (!payload?.item) return;

    onQuestionSaved(payload.item, Boolean(editingId));
    onFeedback(editingId ? "Pergunta atualizada." : "Pergunta criada.");
    closeDrawer();
  }

  const hasFilters = searchQuery.trim() !== "" || filterMacroSlug !== "all";
  const formId = "question-drawer-form";

  return (
    <section
      id="panel-questions"
      role="tabpanel"
      aria-labelledby="tab-questions"
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
              placeholder="Buscar pergunta por enunciado..."
              aria-label="Buscar pergunta"
              className="min-h-11 pl-10"
            />
          </div>
          <Select
            value={filterMacroSlug}
            onChange={(e) => setFilterMacroSlug(e.target.value)}
            aria-label="Filtrar por MacroÁrea"
            className="min-h-11 sm:w-56"
          >
            <option value="all">Todas as MacroÁreas</option>
            {macroAreas.map((area) => (
              <option key={area.id} value={area.slug}>
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
          Nova Pergunta
        </Button>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title="Nenhuma pergunta cadastrada"
          description="Adicione perguntas para compor a etapa Descobrir dos estudantes."
          action={
            <Button
              type="button"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreateDrawer}
              className="min-h-11"
            >
              Nova Pergunta
            </Button>
          }
        />
      ) : filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nenhuma pergunta encontrada"
          description="Nenhuma pergunta corresponde aos filtros aplicados."
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterMacroSlug("all");
                }}
                className="min-h-11"
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => {
            const activeWeights = Object.entries(question.weightsByArea).filter(
              ([, weight]) => weight > 0,
            );
            const optionCount = question.options.length;

            return (
              <Card
                key={question.id}
                padding="md"
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Badge variant="brand" className="shrink-0 tabular-nums">
                      #{question.order}
                    </Badge>
                    <p className="text-sm font-semibold text-[var(--ink-primary)]">
                      {question.prompt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="brand" className="tabular-nums">
                      {optionCount} {optionCount === 1 ? "opção" : "opções"}
                    </Badge>
                    {activeWeights.length === 0 ? (
                      <span className="text-xs text-[var(--ink-muted)]">
                        Sem pesos atribuídos
                      </span>
                    ) : (
                      activeWeights.map(([slug, weight]) => (
                        <Badge
                          key={slug}
                          variant="neutral"
                          className="tabular-nums"
                        >
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
                    className="min-h-11"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEditDrawer(question)}
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
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? "Editar pergunta" : "Nova pergunta do Descobrir"}
        subtitle="Configure a ordem, o enunciado situacional e de 2 a 4 opções com pesos por MacroÁrea (0 a 10)."
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
              {editingId ? "Salvar alterações" : "Criar pergunta"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {formError ? <Alert variant="danger">{formError}</Alert> : null}

          <FormField id="question-order" label="Ordem" required>
            <Input
              type="number"
              min={1}
              required
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="tabular-nums"
            />
          </FormField>

          <FormField id="question-prompt" label="Enunciado" required>
            <Textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--ink-primary)]">
                  Opções situacionais ({options.length}/4)
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Cada opção precisa de texto (5 a 220 caracteres) e ao menos 1
                  peso maior que zero.
                </p>
              </div>
              {options.length < 4 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={addOption}
                  className="min-h-11 shrink-0"
                >
                  Adicionar opção
                </Button>
              ) : null}
            </div>

            {options.map((opt, index) => {
              const legacySlugs = Object.keys(opt.weights).filter(
                (slug) => !knownSlugs.has(slug),
              );

              return (
                <div
                  key={opt.id}
                  className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--ink-primary)]">
                        Opção {index + 1}
                      </span>
                      <Badge variant="neutral" className="font-mono">
                        {opt.id}
                      </Badge>
                    </div>
                    {options.length > 2 ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => removeOption(index)}
                        className="min-h-11"
                      >
                        Remover opção
                      </Button>
                    ) : null}
                  </div>

                  <FormField
                    id={`question-option-${index}-label`}
                    label="Texto da opção"
                    required
                  >
                    <Textarea
                      required
                      rows={2}
                      minLength={5}
                      maxLength={220}
                      value={opt.label}
                      onChange={(e) => updateOptionLabel(index, e.target.value)}
                      placeholder="Descreva a atitude ou decisão do estudante neste cenário..."
                    />
                  </FormField>

                  {macroAreas.length === 0 ? (
                    <p className="text-xs text-[var(--ink-muted)]">
                      Cadastre ao menos uma MacroÁrea para configurar pesos.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {macroAreas.map((area) => (
                        <FormField
                          key={area.id}
                          id={`question-option-${index}-weight-${area.slug}`}
                          label={area.name}
                        >
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={opt.weights[area.slug] ?? "0"}
                            onChange={(e) =>
                              updateOptionWeight(
                                index,
                                area.slug,
                                e.target.value,
                              )
                            }
                            className="tabular-nums"
                          />
                        </FormField>
                      ))}
                    </div>
                  )}

                  {legacySlugs.length > 0 ? (
                    <p className="text-xs text-[var(--ink-muted)]">
                      Chaves legadas preservadas ao salvar:{" "}
                      {legacySlugs.join(", ")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </form>
      </Drawer>
    </section>
  );
}
