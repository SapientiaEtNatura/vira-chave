import { PortfolioManagerClient } from "@/components/portfolio/PortfolioManagerClient";
import { StageBanner } from "@/components/ui/StageBanner";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await requireRole(STUDENT_PORTAL_ROLES);

  const [projects, activeShareLink] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { studentId: user.userId },
      orderBy: { createdAt: "desc" },
      include: {
        challenge: {
          select: { title: true },
        },
        evidenceFiles: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    }),
    prisma.portfolioShareLink.findFirst({
      where: {
        studentId: user.userId,
        active: true,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        includeReadiness: true,
      },
    }),
  ]);

  const serializedProjects = projects.map((project) => ({
    id: project.id,
    challengeId: project.challengeId,
    challengeTitle: project.challenge?.title ?? null,
    title: project.title,
    summary: project.summary,
    reflection: project.reflection,
    externalUrl: project.externalUrl,
    isIncludedInShare: project.isIncludedInShare,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    evidenceFiles: project.evidenceFiles,
  }));

  return (
    <div className="space-y-6">
      <StageBanner
        stage="CONSTRUIR"
        stageLabel="Etapa 4 · Construir"
        title="Meu Portfólio"
        subtitle="Organize seus projetos e evidências com controle total sobre o que você compartilha."
      />

      <PortfolioManagerClient
        initialProjects={serializedProjects}
        initialShareState={{
          hasActiveLink: Boolean(activeShareLink),
          createdAt: activeShareLink
            ? activeShareLink.createdAt.toISOString()
            : null,
          includeReadiness: activeShareLink?.includeReadiness ?? false,
        }}
      />
    </div>
  );
}
