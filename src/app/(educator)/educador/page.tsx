import { BookOpen, ShieldCheck, Users } from "lucide-react";
import { EducatorClassroomsClient } from "@/components/educator/EducatorClassroomsClient";
import { Alert, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole, EDUCATOR_PORTAL_ROLES } from "@/lib/rbac";

export default async function EducatorDashboardPage() {
  const user = await requireRole(EDUCATOR_PORTAL_ROLES);

  const [educator, classrooms] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        name: true,
        institution: {
          select: { name: true },
        },
      },
    }),
    prisma.classroom.findMany({
      where: { educatorId: user.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        active: true,
        createdAt: true,
        institution: {
          select: { name: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    }),
  ]);

  const initialClassrooms = classrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    inviteCode: classroom.inviteCode,
    active: classroom.active,
    createdAt: classroom.createdAt.toISOString(),
    institutionName: classroom.institution.name,
    studentCount: classroom._count.enrollments,
  }));

  const totalStudents = initialClassrooms.reduce(
    (acc, item) => acc + item.studentCount,
    0,
  );
  const activeClassrooms = initialClassrooms.filter((item) => item.active).length;

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <PageHeader
          title="Área do Educador"
          subtitle={`Olá, ${educator?.name ?? "Educador(a)"}. Gerencie suas turmas e acompanhe a evolução educacional dos estudantes com privacidade por padrão.`}
        />

        <Alert variant="info" title="Privacidade protegida (LGPD)">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Anotações privadas de estudo, rascunhos e respostas individuais do
              questionário permanecem protegidos e não são exibidos neste painel.
            </p>
          </div>
        </Alert>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--stage-learn-border)] bg-[var(--stage-learn-bg)] text-[var(--stage-learn-ink)]">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium text-[var(--ink-muted)]">
              Turmas cadastradas
            </p>
            <p className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {initialClassrooms.length}
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--stage-build-border)] bg-[var(--stage-build-bg)] text-[var(--stage-build-ink)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium text-[var(--ink-muted)]">
              Turmas ativas
            </p>
            <p className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {activeClassrooms}
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--stage-discover-border)] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)]">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium text-[var(--ink-muted)]">
              Estudantes vinculados
            </p>
            <p className="font-mono text-2xl font-bold text-[var(--ink-primary)]">
              {totalStudents}
            </p>
          </div>
        </Card>
      </div>

      <EducatorClassroomsClient
        initialClassrooms={initialClassrooms}
        institutionName={educator?.institution?.name ?? null}
      />
    </div>
  );
}
