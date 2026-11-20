import { notFound } from "next/navigation";
import { ConsentType, Role } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";
import { AccountControls } from "./AccountControls";

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
  const authUser = await requireRole(STUDENT_PORTAL_ROLES);

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
    notFound();
  }

  const primaryEnrollment = student.enrollments[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Minha Conta"
        subtitle="Gerencie seus dados, consentimentos LGPD, senha e exclusão de conta."
      />

      <Card id="dados-basicos" as="section">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          Dados da conta
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Nome
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {student.name}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              E-mail
            </dt>
            <dd className="mt-1 break-all text-sm font-semibold text-[var(--ink-primary)]">
              {student.email}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Turma vinculada
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {primaryEnrollment
                ? `${primaryEnrollment.classroom.name} (${primaryEnrollment.classroom.inviteCode})`
                : "Nenhuma turma vinculada"}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Instituição
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">
              {student.institution?.name ?? "Não informada"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card id="consentimentos" as="section">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          Consentimentos LGPD
        </h2>

        {student.consents.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Nenhum registro de consentimento encontrado.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
            {student.consents.map((consent) => (
              <li
                key={consent.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--ink-primary)]">
                    {CONSENT_LABELS[consent.type]}
                  </p>
                  <Badge variant="neutral" mono>
                    Versão {consent.version}
                  </Badge>
                </div>
                <Badge
                  variant="success"
                  mono
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  {formatDate(consent.acceptedAt)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div id="seguranca">
        <AccountControls
          allowAccountDeletion={authUser.role === Role.ESTUDANTE}
        />
      </div>
    </div>
  );
}
