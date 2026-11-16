"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { Alert, Button, FormField, Input } from "@/components/ui";

function getRedirectPath(role?: string): string {
  if (role === "EDUCADOR") return "/educador";
  if (role === "ADMIN") return "/admin";
  return "/app";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError("E-mail ou senha inválidos, ou conta inativa.");
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const sessionData = (await sessionRes.json()) as {
        user?: { role?: string };
      } | null;

      router.push(getRedirectPath(sessionData?.user?.role));
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      headline="Menos “e se?”. Mais “eu fiz”."
      description="Continue sua jornada de descoberta, retome suas trilhas de estudo e organize as evidências do seu portfólio."
    >
      <div className="mb-6 space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Entrar na plataforma
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Acesse sua jornada de descoberta, trilhas e portfólio.
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
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
            className="font-semibold text-[var(--brand-primary)] underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </div>

        <div className="mt-3 flex justify-center gap-4 text-xs text-[var(--ink-muted)]">
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
    </AuthSplitLayout>
  );
}
