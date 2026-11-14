"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  MacroAreaDistributionItem,
  StageDistributionItem,
} from "@/lib/educator/classroom-analytics";

interface ClassroomChartsProps {
  stageDistribution: StageDistributionItem[];
  macroAreaDistribution: MacroAreaDistributionItem[];
}

const STAGE_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981"];

export function ClassroomCharts({
  stageDistribution,
  macroAreaDistribution,
}: ClassroomChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Distribuição por etapa
          </h2>
          <p className="text-xs text-slate-500">
            Quantidade de estudantes em cada etapa da jornada.
          </p>
        </div>

        <div
          className="h-64 w-full"
          role="img"
          aria-label="Gráfico de distribuição de estudantes por etapa"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stageDistribution}
              margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#334155", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value ?? 0}`, "Estudantes"]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  borderColor: "#e2e8f0",
                  fontSize: "0.875rem",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stageDistribution.map((entry, index) => (
                  <Cell
                    key={entry.stage}
                    fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Principais macroáreas de afinidade
          </h2>
          <p className="text-xs text-slate-500">
            Agregação das áreas mais frequentes identificadas na turma.
          </p>
        </div>

        {macroAreaDistribution.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Nenhum estudante da turma concluiu a etapa Descobrir ainda.
          </div>
        ) : (
          <div
            className="h-64 w-full"
            role="img"
            aria-label="Gráfico de distribuição de macroáreas de afinidade na turma"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={macroAreaDistribution}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="area"
                  width={150}
                  tick={{ fill: "#334155", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}`, "Estudantes"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    borderColor: "#e2e8f0",
                    fontSize: "0.875rem",
                  }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
