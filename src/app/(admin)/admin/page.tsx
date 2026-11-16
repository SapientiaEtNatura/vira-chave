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
  AdminFunnelChart,
  AdminRegistrationsChart,
} from "@/components/admin/AdminCharts";
import { Badge, Card } from "@/components/ui";
import { getAdminOverviewData } from "@/lib/admin/overview";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const AUDIT_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminOverviewPage() {
  const authUser = await requireRole([Role.ADMIN]);

  const [data, currentUser] = await Promise.all([
    getAdminOverviewData(),
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { name: true },
    }),
  ]);

  const { kpis, recentAuditLogs } = data;
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || "Admin";
  const hasBrokenLinks = kpis.brokenCourseLinks > 0;

  return (
    <div className="space-y-5">
      {/* Saudação e status discreto */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink-primary)] sm:text-3xl">
            Olá, {firstName}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Visão operacional da plataforma, engajamento nas 4 etapas e auditoria recente.
          </p>
        </div>

        <Badge
          variant={kpis.dbHealthy ? "success" : "danger"}
          className="self-start sm:self-auto"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              kpis.dbHealthy ? "bg-emerald-500" : "bg-red-500"
            }`}
            aria-hidden="true"
          />
          <span>
            {kpis.dbHealthy ? "PostgreSQL Online" : "PostgreSQL Offline"}
          </span>
        </Badge>
      </header>

      {/* Linha superior: Bento 4 + 4 + 4 */}
      <section
        aria-label="Resumo operacional e cadastros"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        {/* Esquerda (4 cols): Card "Visão da Plataforma" */}
        <Card
          padding="md"
          className="flex flex-col justify-between gap-5 rounded-2xl lg:col-span-4"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  Visão da Plataforma
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--ink-primary)] tabular-nums">
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
              >
                <span>Preview Estudante</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/educador"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
              >
                <span>Preview Educador</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                Instituições
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-[var(--ink-primary)] tabular-nums">
                {kpis.activeInstitutions.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                Turmas
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-[var(--ink-primary)] tabular-nums">
                {kpis.activeClassrooms.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                Links
              </p>
              <p
                className={`mt-1 font-display text-sm font-semibold tabular-nums ${
                  hasBrokenLinks
                    ? "text-[var(--status-danger-ink)]"
                    : "text-[var(--status-success-ink)]"
                }`}
              >
                {hasBrokenLinks ? `${kpis.brokenCourseLinks} erro` : "100% OK"}
              </p>
            </div>
          </div>
        </Card>

        {/* Centro (4 cols): Grid 2x2 de Métricas */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <div className="flex flex-col justify-between rounded-2xl bg-[var(--brand-primary)] p-4 text-white shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/85">
                Estudantes
              </span>
              <GraduationCap className="h-4 w-4 text-white/85" aria-hidden="true" />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                {kpis.totalStudents.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-white/80">
                Contas ativas na jornada
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Educadores
              </span>
              <Users className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight text-[var(--ink-primary)] tabular-nums">
                {kpis.totalEducators.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Docentes e mentores
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Instituições Ativas
              </span>
              <Building2 className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold tracking-tight text-[var(--ink-primary)] tabular-nums">
                {kpis.activeInstitutions.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                Escolas habilitadas
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
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
              <p className="font-display text-3xl font-semibold tracking-tight text-[var(--ink-primary)] tabular-nums">
                {kpis.brokenCourseLinks.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                {hasBrokenLinks ? "Requer revisão" : "Cursos saudáveis"}
              </p>
            </div>
          </div>
        </div>

        {/* Direita (4 cols): Card Gráfico "Cadastros (6 meses)" */}
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
          <AdminRegistrationsChart data={data.monthlyRegistrations} />
        </Card>
      </section>

      {/* Linha inferior: Bento 5 + 7 */}
      <section
        aria-label="Funil das etapas e auditoria recente"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        {/* Esquerda (5 cols): Card "Funil das 4 Etapas" */}
        <Card
          padding="md"
          className="flex flex-col justify-between gap-3 rounded-2xl lg:col-span-5"
        >
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
              Funil das 4 Etapas
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Estudantes com atividade registrada por etapa
            </p>
          </div>
          <AdminFunnelChart data={data.stageFunnel} />
        </Card>

        {/* Direita (7 cols): Card "Atividade Recente (Auditoria)" */}
        <Card
          padding="md"
          className="flex flex-col justify-between gap-4 rounded-2xl lg:col-span-7"
        >
          <div className="flex items-center justify-between gap-3">
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
              className="text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
            >
              Ver auditoria completa →
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
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Ator</th>
                    <th className="py-2 pr-3">Ação</th>
                    <th className="py-2 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {recentAuditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-[var(--bg-canvas)]/70"
                    >
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span
                          className="inline-block h-2 w-2 rounded-full bg-[var(--brand-primary)]"
                          aria-hidden="true"
                        />
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-[var(--ink-primary)]">
                        <span>{log.actor?.name ?? "Sistema"}</span>
                        {log.actor?.role ? (
                          <span className="ml-1.5 rounded-full bg-[var(--bg-canvas)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-muted)]">
                            {log.actor.role}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--ink-secondary)]">
                        <span className="font-mono text-[11px] font-medium text-[var(--ink-primary)]">
                          {log.action}
                        </span>
                        <span className="ml-1.5 text-[var(--ink-muted)]">
                          ({log.targetType})
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
                        {AUDIT_DATE_FORMATTER.format(new Date(log.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
