"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import {
  Alert,
  Button,
  FormField,
  Input,
  Select,
} from "@/components/ui";

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
    <AuthSplitLayout
      maxWidth="lg"
      headline="Comece sua jornada com segurança e autonomia."
      description="Use o código da sua turma ou instituição para explorar áreas profissionais, praticar desafios reais e montar seu portfólio."
    >
      <div className="mb-6 space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Criar conta
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Escolha seu perfil e informe o código fornecido pela sua escola.
          </p>
        </div>

        {error ? (
          <Alert variant="danger" className="mb-5">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField id="role" label="Perfil de acesso" required>
            <Select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as SignupRole)}
            >
              <option value="ESTUDANTE">Sou Estudante</option>
              <option value="EDUCADOR">Sou Educador(a)</option>
            </Select>
          </FormField>

          <FormField id="name" label="Nome completo" required>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </FormField>

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

          <FormField
            id="password"
            label="Senha"
            required
            hint="Mínimo de 8 caracteres."
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          {role === "ESTUDANTE" ? (
            <FormField
              id="inviteCode"
              label="Código da turma"
              required
              hint="Ao usar o código da turma, seu perfil será vinculado à turma da sua escola para acompanhamento pedagógico."
            >
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex.: TURMA-2026"
                className="uppercase"
              />
            </FormField>
          ) : (
            <FormField
              id="institutionCode"
              label="Código da instituição"
              required
            >
              <Input
                id="institutionCode"
                name="institutionCode"
                type="text"
                required
                value={institutionCode}
                onChange={(e) =>
                  setInstitutionCode(e.target.value.toUpperCase())
                }
                placeholder="Ex.: ESCOLA-01"
                className="uppercase"
              />
            </FormField>
          )}

          <Alert variant="info">
            {role === "ESTUDANTE"
              ? "Seus rascunhos são privados por padrão. O educador da turma acompanha apenas seu avanço pedagógico."
              : "Educadores assumem compromisso de sigilo sobre os dados dos estudantes, em conformidade com a LGPD e o ECA."}
          </Alert>

          <div className="space-y-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
            <label
              htmlFor="acceptedTerms"
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface)]"
            >
              <input
                id="acceptedTerms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--border-strong)] accent-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
              />
              <span>
                Li e aceito os{" "}
                <Link
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand-primary)] underline underline-offset-4"
                >
                  Termos de Uso
                </Link>
                .
              </span>
            </label>

            <label
              htmlFor="acceptedPrivacy"
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface)]"
            >
              <input
                id="acceptedPrivacy"
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--border-strong)] accent-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
              />
              <span>
                Li e aceito a{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand-primary)] underline underline-offset-4"
                >
                  Política de Privacidade (LGPD)
                </Link>
                .
              </span>
            </label>

            {role === "EDUCADOR" ? (
              <label
                htmlFor="acceptedSigilo"
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface)]"
              >
                <input
                  id="acceptedSigilo"
                  type="checkbox"
                  checked={acceptedSigilo}
                  onChange={(e) => setAcceptedSigilo(e.target.checked)}
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--border-strong)] accent-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                />
                <span>
                  Aceito o{" "}
                  <Link
                    href="/termos#sigilo-educador"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--brand-primary)] underline underline-offset-4"
                  >
                    Termo de Compromisso e Sigilo do Educador
                  </Link>
                  , comprometendo-me a tratar os dados dos estudantes apenas para
                  fins pedagógicos.
                </span>
              </label>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-4 text-center text-sm text-[var(--ink-secondary)]">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-semibold text-[var(--brand-primary)] underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </div>
    </AuthSplitLayout>
  );
}
