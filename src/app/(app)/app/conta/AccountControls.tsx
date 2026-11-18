"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Alert, Button, Card, FormField, Input } from "@/components/ui";

export function AccountControls({
  allowAccountDeletion = true,
}: {
  allowAccountDeletion?: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [understoodDeletion, setUnderstoodDeletion] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete =
    understoodDeletion && confirmationText.trim() === "EXCLUIR" && !deleteLoading;

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setPasswordError(data.error ?? "Não foi possível alterar a senha.");
        setPasswordLoading(false);
        return;
      }

      setPasswordSuccess(data.message ?? "Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Erro de conexão ao alterar a senha.");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canDelete) return;

    setDeleteError(null);
    setDeleteLoading(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmationText.trim() }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setDeleteError(
          data.error ?? "Não foi possível excluir a conta. Tente novamente.",
        );
        setDeleteLoading(false);
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Erro de conexão ao excluir a conta.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card as="section">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          Segurança / Senha
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          Mínimo de 8 caracteres, com letras maiúsculas, minúsculas e número.
        </p>

        {passwordError && (
          <Alert variant="danger" className="mt-4">
            {passwordError}
          </Alert>
        )}

        {passwordSuccess && (
          <Alert variant="success" className="mt-4">
            {passwordSuccess}
          </Alert>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-4 max-w-md space-y-4">
          <FormField id="currentPassword" label="Senha atual" required>
            <Input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>

          <FormField id="newPassword" label="Nova senha" required>
            <Input
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>

          <FormField id="confirmPassword" label="Confirmar nova senha" required>
            <Input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>

          <Button type="submit" variant="primary" loading={passwordLoading}>
            {passwordLoading ? "Salvando..." : "Atualizar senha"}
          </Button>
        </form>
      </Card>

      {allowAccountDeletion && (
        <Card
          as="section"
          className="border-[var(--status-danger-border)] bg-[var(--status-danger-bg)]/50"
        >
          <h2 className="font-display text-lg font-bold text-[var(--status-danger-ink)]">
            Privacidade e exclusão
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-secondary)]">
            Apaga permanentemente seus dados pessoais, progresso, projetos e
            arquivos. Apenas registros anonimizados de consentimento são mantidos
            por exigência legal.
          </p>

          {deleteError && (
            <Alert variant="danger" className="mt-4">
              {deleteError}
            </Alert>
          )}

          <form onSubmit={handleDeleteAccount} className="mt-4 max-w-md space-y-4">
            <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm text-[var(--ink-primary)]">
              <input
                type="checkbox"
                checked={understoodDeletion}
                onChange={(e) => setUnderstoodDeletion(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--status-danger-border)] accent-[var(--status-danger-solid)]"
              />
              <span>
                Entendo que esta ação é permanente e que todos os meus projetos e
                arquivos serão excluídos.
              </span>
            </label>

            <FormField
              id="deleteConfirmation"
              label="Digite EXCLUIR para confirmar"
            >
              <Input
                name="deleteConfirmation"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="EXCLUIR"
              />
            </FormField>

            <Button
              type="submit"
              variant="danger"
              disabled={!canDelete}
              loading={deleteLoading}
            >
              {deleteLoading
                ? "Excluindo conta..."
                : "Excluir minha conta permanentemente"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
