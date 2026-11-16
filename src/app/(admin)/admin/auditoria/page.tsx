import { Role } from "@prisma/client";
import { AdminAuditClient } from "@/components/admin/AdminAuditClient";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const INITIAL_PAGE_SIZE = 30;

export default async function AdminAuditPage() {
  await requireRole([Role.ADMIN]);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: INITIAL_PAGE_SIZE,
      select: {
        id: true,
        actorId: true,
        actorRole: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const serializedLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <PageHeader
          title="Registro de Auditoria"
          subtitle="Acompanhe eventos administrativos, alterações de acesso, verificações de links e ações sensíveis da plataforma."
          action={
            <ButtonLink href="/admin/usuarios" variant="outline" size="sm">
              Gestão de Usuários
            </ButtonLink>
          }
        />
      </Card>

      <AdminAuditClient
        initialLogs={serializedLogs}
        initialPagination={{
          page: 1,
          pageSize: INITIAL_PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / INITIAL_PAGE_SIZE)),
        }}
      />
    </div>
  );
}
