"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Alert, Button, FormField, Input } from "@/components/ui";

function getRedirectPath(role?: string): string {
  if (role === "EDUCADOR") return "/educador";
  if (role === "ADMIN") return "/admin";
  return "/app";
}

function getSafeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  if (raw === "/login" || raw === "/cadastro") return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeCallbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "E-mail ou senha incorretos, ou conta desativada. Se sua conta estiver inativa, fale com sua escola.",
        );
        setLoading(false);
        return;
      }

      if (safeCallbackUrl) {
        router.push(safeCallbackUrl);
        router.refresh();
        return;
      }

      let role: string | undefined;
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = (await sessionRes.json()) as {
            user?: { role?: string };
          } | null;
          role = sessionData?.user?.role;
        }
      } catch {
        // Fallback para /app quando a sessão já foi autenticada
      }

      router.push(getRedirectPath(role));
      router.refresh();
    } catch {
      setError("Não foi possível conectar para entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          Entrar na plataforma
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Acesse seu mapa de afinidades, trilhas, desafios e portfólio.
        </p>
      </div>

      {error ? (
        <Alert variant="danger" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-1">
          <FormField id="password" label="Senha" required>
            {(controlProps) => (
              <div className="relative">
                <Input
                  {...controlProps}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          <div className="flex justify-end">
            <Link
              href="/recuperar-senha"
              className="inline-flex min-h-11 items-center text-xs font-medium text-[var(--brand-primary)] underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 border-t border-[var(--border-subtle)] pt-4 text-center text-sm text-[var(--ink-secondary)]">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="inline-flex min-h-11 items-center font-semibold text-[var(--brand-primary)] underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </div>

      <div className="mt-2 flex justify-center gap-4 text-xs text-[var(--ink-muted)]">
        <Link
          href="/termos"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:text-[var(--ink-primary)] hover:underline"
        >
          Termos de Uso
        </Link>
        <Link
          href="/privacidade"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:text-[var(--ink-primary)] hover:underline"
        >
          Política de Privacidade
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthSplitLayout
      headline="Menos “e se?”. Mais “eu fiz”."
      description="Retome suas trilhas de estudo, envie entregas de desafios práticos e organize seu portfólio compartilhável."
    >
      <Suspense
        fallback={
          <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
