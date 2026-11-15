"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  FormField,
  Input,
  Select,
  StagePill,
} from "@/components/ui";
import type { EducationalViewStudent } from "@/lib/educator/classroom-analytics";
import type { StudentStage } from "@/lib/student/stage";

type StageFilter = "TODOS" | StudentStage;

const STAGE_OPTIONS: Array<{ value: StageFilter; label: string }> = [
  { value: "TODOS", label: "Todas as etapas" },
  { value: "DESCOBRIR", label: "Descobrir" },
  { value: "APRENDER", label: "Aprender" },
  { value: "EXPERIMENTAR", label: "Experimentar" },
  { value: "CONSTRUIR", label: "Construir" },
];

export interface ClassroomStudentsTableProps {
  students: EducationalViewStudent[];
  inviteCode: string;
}

export function ClassroomStudentsTable({
  students,
  inviteCode,
}: ClassroomStudentsTableProps) {
  const [nameQuery, setNameQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("TODOS");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = nameQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchesName =
        normalizedQuery.length === 0 ||
        student.name.toLowerCase().includes(normalizedQuery);
      const matchesStage =
        stageFilter === "TODOS" || student.currentStage === stageFilter;
      return matchesName && matchesStage;
    });
  }, [students, nameQuery, stageFilter]);

  if (students.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Nenhum estudante vinculado ainda"
          description={`Compartilhe o código ${inviteCode} com os estudantes para que ingressem nesta turma.`}
        />
      </div>
    );
  }

  const hasActiveFilters =
    nameQuery.trim().length > 0 || stageFilter !== "TODOS";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:grid-cols-2 lg:grid-cols-[1fr_240px]">
        <FormField id="classroom-student-search" label="Buscar por nome">
          <Input
            type="search"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder="Digite o nome do estudante"
          />
        </FormField>

        <FormField id="classroom-student-stage" label="Filtrar por etapa">
          <Select
            value={stageFilter}
            onChange={(event) =>
              setStageFilter(event.target.value as StageFilter)
            }
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Nenhum estudante encontrado"
            description="Ajuste o nome pesquisado ou selecione outra etapa para visualizar os estudantes."
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNameQuery("");
                    setStageFilter("TODOS");
                  }}
                >
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left text-sm">
            <thead className="bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--ink-secondary)]">
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
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {filteredStudents.map((student) => (
                <tr
                  key={student.studentId}
                  className="transition-colors hover:bg-[var(--bg-canvas)]"
                >
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium text-[var(--ink-primary)]">
                    {student.name}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <StagePill stage={student.currentStage} />
                  </td>
                  <td className="px-5 py-3.5">
                    {student.topMacroAreas.length === 0 ? (
                      <span className="text-xs text-[var(--ink-muted)]">
                        Descobrir ainda não concluído
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {student.topMacroAreas.map((area) => (
                          <Badge key={area} variant="neutral">
                            {area}
                          </Badge>
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
    </div>
  );
}
