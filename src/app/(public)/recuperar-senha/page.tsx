"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Alert, Button, FormField, Input } from "@/components/ui";

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
    <div>
      <div className="mb-6 space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          {token ? "Definir nova senha" : "Recuperar senha"}
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          {token
            ? "Escolha uma nova senha com pelo menos 8 caracteres."
            : "Informe seu e-mail cadastrado para receber o link de recuperação."}
        </p>
      </div>

      {error ? (
        <Alert variant="danger" className="mb-5">
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert variant="success" className="mb-5">
          {message}
        </Alert>
      ) : null}

      {!error && !message && !token ? (
        <Alert variant="info" className="mb-5">
          Por segurança, você receberá as instruções apenas se o e-mail já
          estiver cadastrado na plataforma.
        </Alert>
      ) : null}

      {token ? (
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <FormField
            id="newPassword"
            label="Nova senha"
            required
            hint="Mínimo de 8 caracteres."
          >
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <FormField id="email" label="E-mail" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@escola.br"
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full"
          >
            {loading ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>
      )}

      <div className="mt-6 border-t border-[var(--border-subtle)] pt-4 text-center text-sm text-[var(--ink-secondary)]">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold text-[var(--brand-primary)] underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <AuthSplitLayout
      headline="Recupere seu acesso com tranquilidade."
      description="Enviaremos instruções seguras para você definir uma nova senha e continuar sua jornada."
    >
      <Suspense
        fallback={
          <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
