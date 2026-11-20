"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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

interface ApiIssue {
  path?: Array<string | number>;
  message?: string;
}

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const codeParam = searchParams.get("codigo");

  const [role, setRole] = useState<SignupRole>(
    roleParam === "EDUCADOR" ? "EDUCADOR" : "ESTUDANTE",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState(
    codeParam ? codeParam.toUpperCase() : "",
  );
  const [institutionCode, setInstitutionCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedSigilo, setAcceptedSigilo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleParam === "EDUCADOR") {
      setRole("EDUCADOR");
    }
  }, [roleParam]);

  function handleRoleChange(nextRole: SignupRole) {
    setRole(nextRole);
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
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

      const data = (await response.json()) as {
        error?: string;
        issues?: ApiIssue[];
      };

      if (!response.ok) {
        if (Array.isArray(data.issues) && data.issues.length > 0) {
          const nextFieldErrors: Record<string, string> = {};
          for (const issue of data.issues) {
            const key = String(issue.path?.[0] ?? "");
            if (key && issue.message && !nextFieldErrors[key]) {
              nextFieldErrors[key] = issue.message;
            }
          }
          setFieldErrors(nextFieldErrors);
        }
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
      setError("Erro de conexão ao realizar cadastro. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 space-y-1.5">
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          Criar conta
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Escolha seu perfil e informe o código fornecido pela sua escola ou
          turma.
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
            onChange={(e) => handleRoleChange(e.target.value as SignupRole)}
          >
            <option value="ESTUDANTE">Sou Estudante</option>
            <option value="EDUCADOR">Sou Educador(a)</option>
          </Select>
        </FormField>

        <FormField
          id="name"
          label="Nome completo"
          required
          error={fieldErrors.name}
        >
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

        <FormField
          id="email"
          label="E-mail"
          required
          error={fieldErrors.email}
        >
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
          error={fieldErrors.password}
          hint="Mínimo de 8 caracteres, com letras maiúsculas, minúsculas e número."
        >
          {(controlProps) => (
            <div className="relative">
              <Input
                {...controlProps}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
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

        {role === "ESTUDANTE" ? (
          <FormField
            id="inviteCode"
            label="Código da turma"
            required
            error={fieldErrors.inviteCode}
            hint="Peça o código ao seu professor. Ele vincula sua conta à turma para acompanhamento pedagógico agregado."
          >
            <Input
              id="inviteCode"
              name="inviteCode"
              type="text"
              required
              minLength={3}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ex.: VC-2026"
              className="font-mono uppercase"
            />
          </FormField>
        ) : (
          <FormField
            id="institutionCode"
            label="Código da instituição"
            required
            error={fieldErrors.institutionCode}
            hint="Informe o código institucional fornecido pela coordenação ou equipe do VIRA CHAVE."
          >
            <Input
              id="institutionCode"
              name="institutionCode"
              type="text"
              required
              minLength={3}
              value={institutionCode}
              onChange={(e) =>
                setInstitutionCode(e.target.value.toUpperCase())
              }
              placeholder="Ex.: ESCOLA-01"
              className="font-mono uppercase"
            />
          </FormField>
        )}

        <Alert variant="info">
          {role === "ESTUDANTE"
            ? "Seus rascunhos são privados por padrão. O educador acompanha apenas tendências pedagógicas da turma."
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
                <span className="sr-only"> (abre em nova aba)</span>
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
                <span className="sr-only"> (abre em nova aba)</span>
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
                  <span className="sr-only"> (abre em nova aba)</span>
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
    </>
  );
}

export default function CadastroPage() {
  return (
    <AuthSplitLayout
      maxWidth="lg"
      headline="Comece seu percurso com autonomia e segurança."
      description="Use o código da sua turma ou instituição para mapear afinidades, estudar em trilhas gratuitas e montar seu portfólio."
    >
      <Suspense
        fallback={
          <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
        }
      >
        <CadastroForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
