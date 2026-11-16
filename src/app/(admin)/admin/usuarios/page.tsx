import { Role } from "@prisma/client";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const INITIAL_PAGE_SIZE = 20;

export default async function AdminUsersPage() {
  const session = await requireRole([Role.ADMIN]);

  const [total, users, institutions] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: INITIAL_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            institutionCode: true,
            active: true,
          },
        },
      },
    }),
    prisma.institution.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        institutionCode: true,
      },
    }),
  ]);

  const serializedUsers = users.map((user) => ({
    ...user,
    status: (user.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE") as
      | "ACTIVE"
      | "SUSPENDED",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <PageHeader
          title="Gestão de Usuários"
          subtitle="Pesquise contas da plataforma, ajuste papéis ou vínculos institucionais e gerencie o status de acesso."
          action={
            <ButtonLink href="/admin/auditoria" variant="outline" size="sm">
              Ver auditoria
            </ButtonLink>
          }
        />
      </Card>

      <AdminUsersClient
        currentUserId={session.userId}
        initialUsers={serializedUsers}
        initialPagination={{
          page: 1,
          pageSize: INITIAL_PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / INITIAL_PAGE_SIZE)),
        }}
        activeInstitutions={institutions}
      />
    </div>
  );
}
