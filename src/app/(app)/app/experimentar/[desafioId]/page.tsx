import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
} from "lucide-react";
import { ChallengeSubmitClient } from "@/components/experimentar/ChallengeSubmitClient";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireRole, STUDENT_PORTAL_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function DesafioDetalhePage({
  params,
}: {
  params: Promise<{ desafioId: string }>;
}) {
  const user = await requireRole(STUDENT_PORTAL_ROLES);
  const { desafioId } = await params;

  const challenge = await prisma.challenge.findFirst({
    where: {
      id: desafioId,
      published: true,
    },
    include: {
      macroArea: {
        select: {
          name: true,
          slug: true,
        },
      },
      projects: {
        where: { studentId: user.userId },
        orderBy: { createdAt: "desc" },
        include: {
          evidenceFiles: {
            select: {
              id: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
            },
          },
        },
      },
    },
  });

  if (!challenge) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <ButtonLink
          href="/app/experimentar"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Voltar para desafios
        </ButtonLink>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="neutral">{challenge.macroArea.name}</Badge>
            {challenge.projects.length > 0 && (
              <Badge variant="success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {challenge.projects.length}{" "}
                {challenge.projects.length === 1
                  ? "entrega registrada"
                  : "entregas registradas"}
              </Badge>
            )}
          </div>

          <PageHeader
            stage="EXPERIMENTAR"
            stageLabel="Etapa 3 · Experimentar"
            title={challenge.title}
          />
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink-secondary)]">
            {challenge.description}
          </p>
        </div>
      </Card>

      <ChallengeSubmitClient
        challengeId={challenge.id}
        challengeTitle={challenge.title}
      />

      {challenge.projects.length > 0 && (
        <Card as="section" className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            Suas entregas neste desafio
          </h2>
          <div className="space-y-3">
            {challenge.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-[var(--ink-primary)]">
                    {project.title}
                  </h3>
                  <Badge variant={project.isIncludedInShare ? "brand" : "neutral"}>
                    {project.isIncludedInShare
                      ? "Incluído no compartilhamento"
                      : "Somente privado"}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--ink-secondary)]">
                  {project.reflection}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {project.externalUrl && (
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 font-medium text-[var(--brand-primary)] hover:underline sm:min-h-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Link externo</span>
                    </a>
                  )}
                  {project.evidenceFiles.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/files/${file.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 font-medium text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] hover:underline sm:min-h-0"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{file.originalName}</span>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
