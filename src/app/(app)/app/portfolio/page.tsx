import { Role } from "@prisma/client";
import { PortfolioManagerClient } from "@/components/portfolio/PortfolioManagerClient";
import { StageBanner } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await requireRole([Role.ESTUDANTE]);

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
        subtitle="Reúna seus projetos, reflexões e evidências em um só lugar. Seu portfólio é privado por padrão e você decide o que entra no link compartilhável."
      />

      <PortfolioManagerClient
        initialProjects={serializedProjects}
        initialShareState={{
          hasActiveLink: Boolean(activeShareLink),
          createdAt: activeShareLink
            ? activeShareLink.createdAt.toISOString()
            : null,
        }}
      />
    </div>
  );
}
