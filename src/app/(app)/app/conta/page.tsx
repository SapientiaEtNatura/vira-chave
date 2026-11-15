import { ConsentType, Role } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AccountControls } from "./AccountControls";

const ACCOUNT_SECTIONS = [
  { id: "dados-basicos", label: "Dados básicos" },
  { id: "consentimentos", label: "Consentimentos LGPD" },
  { id: "seguranca", label: "Segurança e Exclusão" },
];

const CONSENT_LABELS: Record<ConsentType, string> = {
  TERMOS_USO: "Termos de Uso",
  PRIVACIDADE: "Política de Privacidade",
  VINCULO_ESCOLAR: "Vínculo Escolar com Turma",
  SIGILO_EDUCADOR: "Termo de Compromisso e Sigilo",
  EXCLUSAO_CONTA: "Exclusão de Conta",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function StudentAccountPage() {
  const authUser = await requireRole([Role.ESTUDANTE]);

  const student = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      name: true,
      email: true,
      institution: {
        select: { name: true },
      },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        select: {
          enrolledAt: true,
          classroom: {
            select: {
              name: true,
              inviteCode: true,
            },
          },
        },
      },
      consents: {
        orderBy: { acceptedAt: "desc" },
        select: {
          id: true,
          type: true,
          version: true,
          acceptedAt: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const primaryEnrollment = student.enrollments[0] ?? null;

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="space-y-2">
          <Badge variant="brand">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Minha Conta e Privacidade</span>
          </Badge>
          <PageHeader
            title="Dados da conta e LGPD"
            subtitle="Consulte seus dados, revise os consentimentos registrados e gerencie sua senha ou exclusão de conta."
          />
        </div>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <aside className="lg:sticky lg:top-20 lg:col-span-4">
          <Card padding="md" className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Seções da conta
            </p>
            <nav aria-label="Seções da conta" className="space-y-1">
              {ACCOUNT_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--brand-primary)]"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </Card>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <Card id="dados-basicos" as="section" className="scroll-mt-24">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              Dados básicos
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Nome
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {student.name}
            </dd>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              E-mail
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {student.email}
            </dd>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Turma vinculada
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {primaryEnrollment
                ? `${primaryEnrollment.classroom.name} (${primaryEnrollment.classroom.inviteCode})`
                : "Nenhuma turma vinculada"}
            </dd>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Instituição
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {student.institution?.name ?? "Não informada"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card id="consentimentos" as="section" className="scroll-mt-24">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          Histórico de consentimentos
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          Registro dos termos e políticas aceitos na plataforma.
        </p>

        {student.consents.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Nenhum registro de consentimento encontrado.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
            {student.consents.map((consent) => (
              <li
                key={consent.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-primary)]">
                    {CONSENT_LABELS[consent.type]}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Versão {consent.version}
                  </p>
                </div>
                <span className="font-mono text-xs font-medium text-[var(--ink-secondary)]">
                  Aceito em {formatDate(consent.acceptedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

          <div id="seguranca" className="scroll-mt-24">
            <AccountControls />
          </div>
        </div>
      </div>
    </div>
  );
}
