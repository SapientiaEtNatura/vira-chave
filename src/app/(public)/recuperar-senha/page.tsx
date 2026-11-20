"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Alert, Button, ButtonLink, FormField, Input } from "@/components/ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);
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
        setError(
          data.error && !/token/i.test(data.error)
            ? data.error
            : "Este link de recuperação é inválido ou expirou. Solicite um novo link abaixo.",
        );
      } else {
        setMessage(
          data.message ?? "Senha redefinida com sucesso. Você já pode entrar.",
        );
        setNewPassword("");
        setResetDone(true);
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
            ? "Crie uma nova senha forte para voltar a acessar sua conta."
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

      {resetDone ? (
        <ButtonLink href="/login" variant="primary" size="md" className="w-full">
          Ir para o login
        </ButtonLink>
      ) : token ? (
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <FormField
            id="newPassword"
            label="Nova senha"
            required
            hint="Mínimo de 8 caracteres, com letras maiúsculas, minúsculas e número."
          >
            {(controlProps) => (
              <div className="relative">
                <Input
                  {...controlProps}
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute top-0 right-0 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-r-lg text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
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

      <div className="mt-6 flex flex-wrap justify-center gap-4 border-t border-[var(--border-subtle)] pt-4 text-center text-sm text-[var(--ink-secondary)]">
        {token && !resetDone ? (
          <Link
            href="/recuperar-senha"
            className="inline-flex min-h-11 items-center font-medium text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--ink-primary)] hover:underline"
          >
            Pedir novo link
          </Link>
        ) : null}
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
      headline="Recupere seu acesso com segurança."
      description="Defina uma nova senha para voltar às suas trilhas, desafios e portfólio sem perder seu progresso."
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
