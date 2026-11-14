import { Role } from "@prisma/client";
import { FolderKanban } from "lucide-react";
import { PortfolioManagerClient } from "@/components/portfolio/PortfolioManagerClient";
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
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FolderKanban className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Etapa 4 · Construir
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Meu Portfólio
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Reúna seus projetos, reflexões e evidências em um só lugar. Seu
          portfólio é privado por padrão e você decide o que entra no link
          compartilhável.
        </p>
      </header>

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
