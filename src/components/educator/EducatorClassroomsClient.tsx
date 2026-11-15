"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Plus,
  Power,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormField,
  Input,
} from "@/components/ui";

export interface EducatorClassroomItem {
  id: string;
  name: string;
  inviteCode: string;
  active: boolean;
  createdAt: string;
  institutionName: string;
  studentCount: number;
}

interface EducatorClassroomsClientProps {
  initialClassrooms: EducatorClassroomItem[];
  institutionName: string | null;
}

export function EducatorClassroomsClient({
  initialClassrooms,
  institutionName,
}: EducatorClassroomsClientProps) {
  const [classrooms, setClassrooms] =
    useState<EducatorClassroomItem[]>(initialClassrooms);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setError("Informe um nome de turma com pelo menos 2 caracteres.");
      return;
    }

    setError(null);
    setCreating(true);
    try {
      const response = await fetch("/api/educator/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const payload = (await response.json()) as {
        classroom?: EducatorClassroomItem;
        error?: string;
      };

      if (!response.ok || !payload.classroom) {
        setError(payload.error ?? "Não foi possível criar a turma.");
        return;
      }

      setClassrooms((prev) => [payload.classroom!, ...prev]);
      setNewName("");
    } catch {
      setError("Erro de conexão ao criar turma.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(classroom: EducatorClassroomItem) {
    setError(null);
    setTogglingId(classroom.id);
    try {
      const response = await fetch(`/api/educator/classrooms/${classroom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !classroom.active }),
      });

      const payload = (await response.json()) as {
        classroom?: EducatorClassroomItem;
        error?: string;
      };

      if (!response.ok || !payload.classroom) {
        setError(payload.error ?? "Não foi possível atualizar a turma.");
        return;
      }

      setClassrooms((prev) =>
        prev.map((item) =>
          item.id === classroom.id ? payload.classroom! : item,
        ),
      );
    } catch {
      setError("Erro de conexão ao atualizar turma.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCopyCode(classroom: EducatorClassroomItem) {
    try {
      await navigator.clipboard.writeText(classroom.inviteCode);
      setCopiedId(classroom.id);
      setTimeout(() => {
        setCopiedId((current) => (current === classroom.id ? null : current));
      }, 2000);
    } catch {
      setError("Não foi possível copiar o código automaticamente.");
    }
  }

  return (
    <div className="space-y-6">
      <Card as="section" padding="md">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            Criar nova turma
          </h2>
          <p className="text-sm text-[var(--ink-secondary)]">
            {institutionName
              ? `Instituição vinculada: ${institutionName}`
              : "Crie turmas e compartilhe o código de convite com seus estudantes."}
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <FormField
            id="new-classroom-name"
            label="Nome da nova turma"
            className="flex-1"
          >
            <Input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex.: 3º Ano B — Projeto de Vida"
              maxLength={120}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            loading={creating}
            leftIcon={<Plus className="h-4 w-4" />}
            className="min-h-11 shrink-0"
          >
            {creating ? "Criando..." : "Criar turma"}
          </Button>
        </form>

        {error ? (
          <Alert variant="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            Minhas turmas ({classrooms.length})
          </h2>
        </div>

        {classrooms.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Nenhuma turma criada ainda"
            description="Crie sua primeira turma acima para gerar um código de convite e acompanhar a jornada dos estudantes."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classrooms.map((classroom) => (
              <Card
                key={classroom.id}
                as="article"
                variant="interactive"
                padding="md"
                className="flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-[var(--ink-primary)]">
                        {classroom.name}
                      </h3>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {classroom.institutionName}
                      </p>
                    </div>
                    <Badge variant={classroom.active ? "success" : "neutral"}>
                      {classroom.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] px-3 py-2.5">
                    <div>
                      <span className="block text-xs font-medium text-[var(--ink-muted)]">
                        Código de convite
                      </span>
                      <span className="font-mono text-sm font-bold tracking-wider text-[var(--ink-primary)]">
                        {classroom.inviteCode}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(classroom)}
                      leftIcon={
                        copiedId === classroom.id ? (
                          <Check className="h-3.5 w-3.5 text-[var(--status-success-ink)]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )
                      }
                    >
                      {copiedId === classroom.id ? "Copiado" : "Copiar código"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-[var(--ink-secondary)]">
                    <Users
                      className="h-4 w-4 text-[var(--ink-muted)]"
                      aria-hidden="true"
                    />
                    <span>
                      {classroom.studentCount}{" "}
                      {classroom.studentCount === 1
                        ? "estudante vinculado"
                        : "estudantes vinculados"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={togglingId === classroom.id}
                    loading={togglingId === classroom.id}
                    onClick={() => handleToggleActive(classroom)}
                    leftIcon={<Power className="h-3.5 w-3.5" />}
                  >
                    {classroom.active ? "Desativar código" : "Ativar código"}
                  </Button>

                  <ButtonLink
                    href={`/educador/turmas/${classroom.id}`}
                    variant="secondary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Ver visão educacional
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
