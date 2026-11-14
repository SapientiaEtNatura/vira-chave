import { Role } from "@prisma/client";
import { EducatorClassroomsClient } from "@/components/educator/EducatorClassroomsClient";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export default async function EducatorDashboardPage() {
  const user = await requireRole([Role.EDUCADOR]);

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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Área do Educador
        </h1>
        <p className="text-sm text-slate-600">
          Olá, {educator?.name ?? "Educador(a)"}. Gerencie suas turmas e
          acompanhe a evolução educacional dos estudantes com privacidade por
          padrão.
        </p>
      </header>

      <EducatorClassroomsClient
        initialClassrooms={initialClassrooms}
        institutionName={educator?.institution?.name ?? null}
      />
    </div>
  );
}
