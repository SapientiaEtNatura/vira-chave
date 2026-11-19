import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { ClassroomCharts } from "@/components/educator/ClassroomCharts";
import { ClassroomStudentsTable } from "@/components/educator/ClassroomStudentsTable";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import { getClassroomEducationalView } from "@/lib/educator/classroom-analytics";
import { requireRole, EDUCATOR_PORTAL_ROLES } from "@/lib/rbac";

export default async function EducatorClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(EDUCATOR_PORTAL_ROLES);
  const { id } = await params;

  const view = await getClassroomEducationalView(id, user.userId);
  if (!view) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-3">
        <Link
          href="/educador"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)] sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar para turmas</span>
        </Link>

        <PageHeader
          title={view.classroom.name}
          subtitle={`${view.classroom.institutionName} · Código ${view.classroom.inviteCode}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={view.classroom.active ? "success" : "neutral"}>
                {view.classroom.active ? "Turma ativa" : "Código inativo"}
              </Badge>
              <Badge variant="neutral">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {view.totalStudents}{" "}
                  {view.totalStudents === 1 ? "estudante" : "estudantes"}
                </span>
              </Badge>
            </div>
          }
        />
      </Card>

      <Alert
        variant="info"
        title="Visão Educacional com Privacidade por Padrão"
      >
        Esta tela exibe apenas a etapa atual na jornada e as principais
        macroáreas de afinidade de cada estudante. Respostas individuais,
        anotações, e-mails e projetos privados de portfólio permanecem
        protegidos.
      </Alert>

      <ClassroomCharts
        stageDistribution={view.stageDistribution}
        macroAreaDistribution={view.macroAreaDistribution}
        topGapArea={view.topGapArea}
      />

      <Card as="section" padding="sm" className="overflow-hidden p-0 sm:p-0">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
            Resumo dos estudantes
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Acompanhamento pedagógico por etapa e macroáreas de interesse.
          </p>
        </div>

        <ClassroomStudentsTable
          students={view.students}
          inviteCode={view.classroom.inviteCode}
        />
      </Card>
    </div>
  );
}
