import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Rocket,
} from "lucide-react";
import { ChallengeSubmitClient } from "@/components/experimentar/ChallengeSubmitClient";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function DesafioDetalhePage({
  params,
}: {
  params: Promise<{ desafioId: string }>;
}) {
  const user = await requireRole([Role.ESTUDANTE]);
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
        <Link
          href="/app/experimentar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar para desafios</span>
        </Link>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            {challenge.macroArea.name}
          </span>
          {challenge.projects.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {challenge.projects.length}{" "}
              {challenge.projects.length === 1
                ? "entrega registrada"
                : "entregas registradas"}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {challenge.title}
        </h1>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {challenge.description}
        </p>
      </header>

      <ChallengeSubmitClient
        challengeId={challenge.id}
        challengeTitle={challenge.title}
      />

      {challenge.projects.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Suas entregas neste desafio
          </h2>
          <div className="space-y-3">
            {challenge.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {project.title}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.isIncludedInShare
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {project.isIncludedInShare
                      ? "Incluído no compartilhamento"
                      : "Somente privado"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                  {project.reflection}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {project.externalUrl && (
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
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
                      className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-indigo-700 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{file.originalName}</span>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
