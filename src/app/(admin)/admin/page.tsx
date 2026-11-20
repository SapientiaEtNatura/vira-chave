import Link from "next/link";
import { Role } from "@prisma/client";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  MonthlyRegistrationsChartDynamic,
  StageFunnelChartDynamic,
} from "@/components/admin/AdminChartsDynamic";
import { Badge, Card, type BadgeVariant } from "@/components/ui";
import { getAdminOverviewData } from "@/lib/admin/overview";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const AUDIT_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EDUCADOR: "Educador",
  ESTUDANTE: "Estudante",
};

const TARGET_LABELS: Record<string, string> = {
  User: "Usuário",
  Institution: "Instituição",
  Classroom: "Turma",
  MacroArea: "Macroárea",
  Track: "Trilha",
  CourseItem: "Curso",
  Challenge: "Desafio",
  DiscoveryQuestion: "Pergunta",
};

const ACTION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  USER_UPDATED: { label: "Usuário atualizado", variant: "warning" },
  INSTITUTION_CREATED: { label: "Instituição criada", variant: "success" },
  INSTITUTION_UPDATED: { label: "Instituição atualizada", variant: "warning" },
  CLASSROOM_UPDATED: { label: "Turma atualizada", variant: "warning" },
  CONTENT_CREATED: { label: "Conteúdo criado", variant: "success" },
  CONTENT_UPDATED: { label: "Conteúdo atualizado", variant: "warning" },
  CONTENT_DELETED: { label: "Conteúdo excluído", variant: "danger" },
  LINKS_CHECKED: { label: "Links verificados", variant: "brand" },
  ACCOUNT_DELETED: { label: "Conta excluída", variant: "danger" },
  AUTH_LOGIN_FAILED: { label: "Falha de login", variant: "danger" },
};

export default async function AdminOverviewPage() {
  const authUser = await requireRole([Role.ADMIN]);
  const data = await getAdminOverviewData();

  const { kpis, recentAuditLogs } = data;
  const firstName = authUser.name?.trim().split(/\s+/)[0] || "Admin";
  const hasBrokenLinks = kpis.brokenCourseLinks > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink-primary)] sm:text-3xl">
            Olá, {firstName}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Visão operacional da plataforma, engajamento nas 4 etapas e
            auditoria recente.
          </p>
        </div>

        <Badge
          dot
          variant={kpis.dbHealthy ? "success" : "danger"}
          className="self-start sm:self-auto"
        >
          {kpis.dbHealthy ? "PostgreSQL Online" : "PostgreSQL Offline"}
        </Badge>
      </header>

      <section
        aria-label="Resumo operacional e cadastros"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <Card
          padding="md"
          className="flex flex-col justify-between gap-5 rounded-2xl lg:col-span-4"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--ink-muted)]">
                  Visão da Plataforma
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tracking-tight tabular-nums text-[var(--ink-primary)]">
                  {kpis.totalUsers.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-[var(--ink-secondary)]">
                  contas cadastradas no total
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/app"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] sm:min-h-9"
              >
                <span>Visão Estudante</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/educador"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)] sm:min-h-9"
              >
                <span>Visão Educador</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/admin/instituicoes"
              className="rounded-xl bg-[var(--bg-canvas)] p-3 transition-colors hover:bg-[var(--bg-surface-subtle)]"
            >
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Turmas ativas
              </p>
              <p className="mt-1 font-display text-lg font-semibold tabular-nums text-[var(--ink-primary)]">
                {kpis.activeClassrooms.toLocaleString("pt-BR")}
              </p>
            </Link>
            <Link
              href="/admin/usuarios"
              className="rounded-xl bg-[var(--bg-canvas)] p-3 transition-colors hover:bg-[var(--bg-surface-subtle)]"
            >
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Gerenciar contas
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]">
                <span>Abrir usuários</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </p>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <Link
            href="/admin/usuarios"
            className="flex flex-col justify-between rounded-2xl bg-[var(--brand-primary)] p-4 text-white shadow-xs transition-colors hover:bg-[var(--brand-primary-hover)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/85">
                Estudantes
              </span>
              <GraduationCap
                className="h-4 w-4 text-white/85"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                {kpis.totalStudents.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-white/80">
                Contas ativas no percurso
              </p>
            </div>
          </Link>

          <Link
            href="/admin/usuarios"
            className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Educadores
              </span>
              <Users
                className="h-4 w-4 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums text-[var(--ink-primary)]">
                {kpis.totalEducators.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Docentes e mentores
              </p>
            </div>
          </Link>

          <Link
            href="/admin/instituicoes"
            className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Instituições Ativas
              </span>
              <Building2
                className="h-4 w-4 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums text-[var(--ink-primary)]">
                {kpis.activeInstitutions.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Escolas habilitadas
              </p>
            </div>
          </Link>

          <Link
            href="/admin/conteudo"
            className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Links com Erro
              </span>
              <AlertTriangle
                className={`h-4 w-4 ${
                  hasBrokenLinks
                    ? "text-[var(--status-danger-ink)]"
                    : "text-[var(--ink-muted)]"
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums text-[var(--ink-primary)]">
                {kpis.brokenCourseLinks.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                {hasBrokenLinks
                  ? `${kpis.brokenCourseLinks} ${kpis.brokenCourseLinks === 1 ? "link para revisar" : "links para revisar"}`
                  : "Cursos saudáveis"}
              </p>
            </div>
          </Link>
        </div>

        <Card
          padding="md"
          className="flex flex-col justify-between gap-3 rounded-2xl lg:col-span-4"
        >
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
              Cadastros (6 meses)
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Novos estudantes e educadores por mês
            </p>
          </div>
          <MonthlyRegistrationsChartDynamic data={data.monthlyRegistrations} />
        </Card>
      </section>

      <section
        aria-label="Funil das etapas e auditoria recente"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <Card
          padding="md"
          className="flex flex-col justify-between gap-3 rounded-2xl lg:col-span-5"
        >
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
              Engajamento nas 4 Etapas
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Estudantes com atividade registrada por etapa
            </p>
          </div>
          <StageFunnelChartDynamic data={data.stageFunnel} />
        </Card>

        <Card
          padding="md"
          className="flex flex-col justify-between gap-4 rounded-2xl lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
                Atividade Recente (Auditoria)
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Últimos 5 eventos administrativos registrados
              </p>
            </div>
            <Link
              href="/admin/auditoria"
              className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)] hover:underline sm:min-h-9"
            >
              Ver auditoria completa
            </Link>
          </div>

          {recentAuditLogs.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl bg-[var(--bg-canvas)] px-4 py-10 text-center">
              <p className="text-xs text-[var(--ink-muted)]">
                Nenhum registro de auditoria encontrado até o momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    <th className="py-2 pr-3">Ator</th>
                    <th className="py-2 pr-3">Evento</th>
                    <th className="py-2 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {recentAuditLogs.map((log) => {
                    const meta = ACTION_META[log.action] ?? {
                      label: log.action,
                      variant: "neutral" as BadgeVariant,
                    };
                    const roleLabel = log.actor?.role
                      ? (ROLE_LABELS[log.actor.role] ?? log.actor.role)
                      : null;
                    const targetLabel =
                      TARGET_LABELS[log.targetType] ?? log.targetType;

                    return (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-[var(--bg-canvas)]/70"
                      >
                        <td className="py-2.5 pr-3 font-medium text-[var(--ink-primary)]">
                          <span>{log.actor?.name ?? "Sistema"}</span>
                          {roleLabel ? (
                            <span className="ml-1.5 rounded-full bg-[var(--bg-canvas)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-muted)]">
                              {roleLabel}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge dot variant={meta.variant}>
                              {meta.label}
                            </Badge>
                            <span className="text-[var(--ink-muted)]">
                              {targetLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap tabular-nums text-[var(--ink-muted)]">
                          {AUDIT_DATE_FORMATTER.format(new Date(log.createdAt))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
