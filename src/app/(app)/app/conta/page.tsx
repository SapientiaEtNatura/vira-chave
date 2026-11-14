import { ConsentType, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
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
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Minha Conta e Privacidade
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Dados da conta e LGPD
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulte seus dados, revise os consentimentos registrados e gerencie
          sua senha ou exclusão de conta.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Dados básicos</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Nome
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {student.name}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
              E-mail
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {student.email}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Turma vinculada
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {primaryEnrollment
                ? `${primaryEnrollment.classroom.name} (${primaryEnrollment.classroom.inviteCode})`
                : "Nenhuma turma vinculada"}
            </dd>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Instituição
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {student.institution?.name ?? "Não informada"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Histórico de consentimentos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Registro dos termos e políticas aceitos na plataforma.
        </p>

        {student.consents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhum registro de consentimento encontrado.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {student.consents.map((consent) => (
              <li
                key={consent.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {CONSENT_LABELS[consent.type]}
                  </p>
                  <p className="text-xs text-slate-500">
                    Versão {consent.version}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600">
                  Aceito em {formatDate(consent.acceptedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AccountControls />
    </div>
  );
}
