"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível processar sua solicitação.");
      } else {
        setMessage(
          data.message ??
            "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
        );
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Token inválido ou expirado.");
      } else {
        setMessage(
          data.message ?? "Senha redefinida com sucesso. Você já pode entrar.",
        );
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          VIRA CHAVE
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {token ? "Definir nova senha" : "Recuperar senha"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {token
            ? "Escolha uma nova senha com pelo menos 8 caracteres."
            : "Informe seu e-mail cadastrado para receber o link de recuperação."}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {token ? (
        <form onSubmit={handleConfirmReset} className="space-y-4">
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@escola.br"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar instruções"}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-sm text-slate-600">
            Carregando...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
