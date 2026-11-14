import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { ClassroomCharts } from "@/components/educator/ClassroomCharts";
import {
  getClassroomEducationalView,
  STAGE_LABELS,
} from "@/lib/educator/classroom-analytics";
import { requireRole } from "@/lib/rbac";

const STAGE_BADGE_CLASS: Record<string, string> = {
  DESCOBRIR: "bg-indigo-50 text-indigo-700",
  APRENDER: "bg-sky-50 text-sky-700",
  EXPERIMENTAR: "bg-amber-50 text-amber-700",
  CONSTRUIR: "bg-emerald-50 text-emerald-700",
};

export default async function EducatorClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.EDUCADOR]);
  const { id } = await params;

  const view = await getClassroomEducationalView(id, user.userId);
  if (!view) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/educador"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar para turmas</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {view.classroom.name}
          </h1>
          <p className="text-sm text-slate-600">
            {view.classroom.institutionName} · Código{" "}
            <span className="font-mono font-semibold text-slate-900">
              {view.classroom.inviteCode}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={
              view.classroom.active
                ? "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                : "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            }
          >
            {view.classroom.active ? "Turma ativa" : "Código inativo"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>
              {view.totalStudents}{" "}
              {view.totalStudents === 1 ? "estudante" : "estudantes"}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-sm text-indigo-950">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
          aria-hidden="true"
        />
        <p>
          <strong>Visão Educacional com Privacidade por Padrão:</strong> esta
          tela exibe apenas a etapa atual na jornada e as principais macroáreas
          de afinidade de cada estudante. Respostas individuais, anotações,
          e-mails e projetos privados de portfólio permanecem protegidos.
        </p>
      </div>

      <ClassroomCharts
        stageDistribution={view.stageDistribution}
        macroAreaDistribution={view.macroAreaDistribution}
      />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Resumo dos estudantes
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhamento pedagógico por etapa e macroáreas de interesse.
          </p>
        </div>

        {view.students.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            Nenhum estudante vinculado a esta turma ainda. Compartilhe o código{" "}
            <span className="font-mono font-semibold text-slate-900">
              {view.classroom.inviteCode}
            </span>{" "}
            para que os alunos ingressem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Estudante
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Etapa atual
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Principais macroáreas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {view.students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
                      {student.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STAGE_BADGE_CLASS[student.currentStage] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {STAGE_LABELS[student.currentStage]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {student.topMacroAreas.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          Descobrir ainda não concluído
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {student.topMacroAreas.map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
