"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function getRedirectPath(role?: string): string {
  if (role === "EDUCADOR") return "/educador";
  if (role === "ADMIN") return "/admin/conteudo";
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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            VIRA CHAVE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Entrar na plataforma
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acesse sua jornada de descoberta, trilhas e portfólio.
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@escola.br"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <Link
                href="/recuperar-senha"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Esqueci minha senha
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Criar conta
          </Link>
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs text-slate-500">
          <Link href="/termos" className="hover:underline">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </main>
  );
}
