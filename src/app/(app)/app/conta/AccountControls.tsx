"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function AccountControls() {
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Alterar senha</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use uma senha forte com pelo menos 8 caracteres.
        </p>

        {passwordError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4 max-w-md">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Senha atual
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Nova senha
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {passwordLoading ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-red-950">
          Exclusão de Conta (LGPD)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-red-900">
          Ao excluir sua conta, seus dados pessoais (nome, e-mail e senha),
          resultados do questionário, progresso nas trilhas, projetos do
          portfólio, arquivos enviados e links compartilháveis serão apagados de
          forma permanente e irreversível. Apenas registros anonimizados de
          consentimento são mantidos para cumprimento legal, sem identificação
          pessoal.
        </p>

        {deleteError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-3 text-sm text-red-700"
          >
            {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="mt-4 space-y-4 max-w-md">
          <label className="flex items-start gap-2.5 text-sm text-red-950">
            <input
              type="checkbox"
              checked={understoodDeletion}
              onChange={(e) => setUnderstoodDeletion(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <span>
              Entendo que esta ação é permanente e que todos os meus projetos e
              arquivos serão excluídos.
            </span>
          </label>

          <div>
            <label
              htmlFor="deleteConfirmation"
              className="block text-sm font-medium text-red-950"
            >
              Digite <strong>EXCLUIR</strong> para confirmar
            </label>
            <input
              id="deleteConfirmation"
              name="deleteConfirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="EXCLUIR"
              className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          <button
            type="submit"
            disabled={!canDelete}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteLoading
              ? "Excluindo conta..."
              : "Excluir minha conta permanentemente"}
          </button>
        </form>
      </section>
    </div>
  );
}
