"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type SignupRole = "ESTUDANTE" | "EDUCADOR";

export default function CadastroPage() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>("ESTUDANTE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedSigilo, setAcceptedSigilo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload =
      role === "ESTUDANTE"
        ? {
            role,
            name,
            email,
            password,
            inviteCode,
            acceptedTerms,
            acceptedPrivacy,
          }
        : {
            role,
            name,
            email,
            password,
            institutionCode,
            acceptedTerms,
            acceptedPrivacy,
            acceptedSigilo,
          };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível concluir o cadastro.");
        setLoading(false);
        return;
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult && !loginResult.error) {
        router.push(role === "EDUCADOR" ? "/educador" : "/app");
        router.refresh();
        return;
      }

      router.push("/login");
    } catch {
      setError("Erro de conexão ao realizar cadastro.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            VIRA CHAVE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Escolha seu perfil e informe o código fornecido pela sua escola.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRole("ESTUDANTE")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              role === "ESTUDANTE"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sou Estudante
          </button>
          <button
            type="button"
            onClick={() => setRole("EDUCADOR")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              role === "EDUCADOR"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sou Educador(a)
          </button>
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
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Senha (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {role === "ESTUDANTE" ? (
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-slate-700"
              >
                Código da turma
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex.: TURMA-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Ao usar o código da turma, seu perfil será vinculado à turma da
                sua escola para acompanhamento pedagógico.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="institutionCode"
                className="block text-sm font-medium text-slate-700"
              >
                Código da instituição
              </label>
              <input
                id="institutionCode"
                name="institutionCode"
                type="text"
                required
                value={institutionCode}
                onChange={(e) =>
                  setInstitutionCode(e.target.value.toUpperCase())
                }
                placeholder="Ex.: ESCOLA-01"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                Li e aceito os{" "}
                <Link
                  href="/termos"
                  target="_blank"
                  className="font-medium text-indigo-600 underline"
                >
                  Termos de Uso
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                Li e aceito a{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  className="font-medium text-indigo-600 underline"
                >
                  Política de Privacidade (LGPD)
                </Link>
                .
              </span>
            </label>

            {role === "EDUCADOR" && (
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptedSigilo}
                  onChange={(e) => setAcceptedSigilo(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Aceito o{" "}
                  <Link
                    href="/termos#sigilo-educador"
                    target="_blank"
                    className="font-medium text-indigo-600 underline"
                  >
                    Termo de Compromisso e Sigilo do Educador
                  </Link>
                  , comprometendo-me a tratar os dados dos estudantes apenas para
                  fins pedagógicos.
                </span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
