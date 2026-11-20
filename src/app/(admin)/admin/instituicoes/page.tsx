import { Role } from "@prisma/client";
import { AdminInstitutionsClient } from "@/components/admin/AdminInstitutionsClient";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminInstitutionsPage() {
  await requireRole([Role.ADMIN]);
  const [institutions, educators] = await Promise.all([
    prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        institutionCode: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            classrooms: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.EDUCADOR },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        institutionId: true,
        createdAt: true,
        institution: {
          select: { id: true, name: true, active: true },
        },
      },
    }),
  ]);

  const serializedInstitutions = institutions.map((inst) => ({
    id: inst.id,
    name: inst.name,
    institutionCode: inst.institutionCode,
    active: inst.active,
    createdAt: inst.createdAt.toISOString(),
    userCount: inst._count.users,
    classroomCount: inst._count.classrooms,
  }));

  const serializedEducators = educators.map((edu) => ({
    id: edu.id,
    name: edu.name,
    email: edu.email,
    status: edu.status,
    institutionId: edu.institutionId,
    institutionName: edu.institution?.name ?? null,
    institutionActive: edu.institution?.active ?? null,
    createdAt: edu.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-3">
        <Badge variant="brand">Administração</Badge>
        <PageHeader
          title="Instituições e Educadores"
          subtitle="Cadastre instituições parceiras, gerencie códigos institucionais e acompanhe os educadores vinculados."
          action={
            <ButtonLink href="/admin/conteudo" variant="outline" size="sm">
              Ir para Conteúdos
            </ButtonLink>
          }
        />
      </Card>

      <AdminInstitutionsClient
        initialInstitutions={serializedInstitutions}
        initialEducators={serializedEducators}
      />
    </div>
  );
}
