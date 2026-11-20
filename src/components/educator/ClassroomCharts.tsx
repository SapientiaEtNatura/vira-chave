"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, Card } from "@/components/ui";
import type {
  ClassroomTopGapArea,
  MacroAreaDistributionItem,
  StageDistributionItem,
} from "@/lib/educator/classroom-analytics";

interface ClassroomChartsProps {
  stageDistribution: StageDistributionItem[];
  macroAreaDistribution: MacroAreaDistributionItem[];
  topGapArea?: ClassroomTopGapArea | null;
}

const STAGE_COLOR_BY_KEY: Record<string, string> = {
  DESCOBRIR: "var(--chart-1)",
  APRENDER: "var(--chart-2)",
  EXPERIMENTAR: "var(--chart-3)",
  CONSTRUIR: "var(--chart-4)",
};

export function ClassroomCharts({
  stageDistribution,
  macroAreaDistribution,
  topGapArea = null,
}: ClassroomChartsProps) {
  const totalStageStudents = stageDistribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const macroChartHeight = Math.max(256, macroAreaDistribution.length * 48);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card as="section" padding="md" className="relative min-w-0">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
            Distribuição por etapa
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Quantidade de estudantes ativos em cada etapa do percurso.
          </p>
        </div>

        {totalStageStudents === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] p-6 text-center text-sm text-[var(--ink-muted)]">
            Nenhum estudante vinculado a esta turma ainda.
          </div>
        ) : (
          <>
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
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value ?? 0).toLocaleString("pt-BR"),
                      "Estudantes",
                    ]}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--ink-primary)",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {stageDistribution.map((entry) => (
                      <Cell
                        key={entry.stage}
                        fill={
                          STAGE_COLOR_BY_KEY[entry.stage] ??
                          "var(--chart-primary)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="sr-only">
              <table>
                <caption>Estudantes por etapa na turma</caption>
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Estudantes</th>
                  </tr>
                </thead>
                <tbody>
                  {stageDistribution.map((entry) => (
                    <tr key={entry.stage}>
                      <td>{entry.label}</td>
                      <td>{entry.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card as="section" padding="md" className="relative min-w-0">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-[var(--ink-primary)]">
            Interesse × Prática comprovada por macroárea
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Prática comprovada conta estudantes com curso concluído ou desafio
            enviado na respectiva macroárea.
          </p>
        </div>

        {topGapArea ? (
          <Alert variant="warning" className="mb-4 px-3.5 py-2.5 text-xs">
            <span>
              <strong>Maior oportunidade de capacitação:</strong>{" "}
              {topGapArea.area} ({topGapArea.interestCount} interessados ·{" "}
              {topGapArea.practiceCount} com prática comprovada)
            </span>
          </Alert>
        ) : null}

        {macroAreaDistribution.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] p-6 text-center text-sm text-[var(--ink-muted)]">
            Nenhum estudante da turma concluiu a etapa Descobrir ou registrou
            prática comprovada ainda.
          </div>
        ) : (
          <>
            <div
              style={{ height: `${macroChartHeight}px` }}
              className="w-full"
              role="img"
              aria-label="Gráfico comparativo de interesse e prática comprovada por macroárea na turma"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={macroAreaDistribution}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="area"
                    width={126}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      Number(value ?? 0).toLocaleString("pt-BR"),
                      String(name ?? "Estudantes"),
                    ]}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--ink-primary)",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                  <Bar
                    dataKey="interestCount"
                    name="Interesse na turma"
                    fill="var(--chart-primary)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="practiceCount"
                    name="Com prática comprovada"
                    fill="var(--chart-secondary)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="sr-only">
              <table>
                <caption>
                  Interesse e prática comprovada por macroárea na turma
                </caption>
                <thead>
                  <tr>
                    <th>Macroárea</th>
                    <th>Interesse</th>
                    <th>Prática comprovada</th>
                  </tr>
                </thead>
                <tbody>
                  {macroAreaDistribution.map((entry) => (
                    <tr key={entry.area}>
                      <td>{entry.area}</td>
                      <td>{entry.interestCount}</td>
                      <td>{entry.practiceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
