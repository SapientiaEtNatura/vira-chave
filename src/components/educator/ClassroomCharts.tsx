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
import { Card } from "@/components/ui";
import type {
  MacroAreaDistributionItem,
  StageDistributionItem,
} from "@/lib/educator/classroom-analytics";

interface ClassroomChartsProps {
  stageDistribution: StageDistributionItem[];
  macroAreaDistribution: MacroAreaDistributionItem[];
}

const STAGE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export function ClassroomCharts({
  stageDistribution,
  macroAreaDistribution,
}: ClassroomChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card as="section" padding="md">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
            Distribuição por etapa
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value ?? 0}`, "Estudantes"]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--ink-primary)",
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
      </Card>

      <Card as="section" padding="md">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
            Principais macroáreas de afinidade
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Agregação das áreas mais frequentes identificadas na turma.
          </p>
        </div>

        {macroAreaDistribution.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] p-6 text-center text-sm text-[var(--ink-muted)]">
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="area"
                  width={150}
                  tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}`, "Estudantes"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--ink-primary)",
                    fontSize: "0.875rem",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-primary)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
