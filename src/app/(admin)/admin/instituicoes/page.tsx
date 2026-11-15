import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AdminInstitutionsClient } from "@/components/admin/AdminInstitutionsClient";

export const dynamic = "force-dynamic";

export default async function AdminInstitutionsPage() {
  await requireRole([Role.ADMIN]);
  const [institutions, educators] = await Promise.all([
    prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Instituições e Educadores
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre instituições parceiras, gerencie códigos institucionais e
          acompanhe os educadores vinculados.
        </p>
      </div>

      <AdminInstitutionsClient
        initialInstitutions={serializedInstitutions}
        initialEducators={serializedEducators}
      />
    </div>
  );
}
