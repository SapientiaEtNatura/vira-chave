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
import type {
  MonthlyRegistrationBucket,
  StageFunnelStep,
} from "@/lib/admin/overview";

const STAGE_COLORS: Record<StageFunnelStep["stage"], string> = {
  Descobrir: "var(--chart-1)",
  Aprender: "var(--chart-2)",
  Experimentar: "var(--chart-3)",
  Construir: "var(--chart-4)",
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-surface)",
  borderColor: "var(--border-subtle)",
  borderRadius: "0.75rem",
  color: "var(--ink-primary)",
  fontSize: "0.75rem",
};

export interface AdminRegistrationsChartProps {
  data: MonthlyRegistrationBucket[];
}

export function AdminRegistrationsChart({
  data,
}: AdminRegistrationsChartProps) {
  const hasRegistrations = data.some(
    (item) => item.estudantes > 0 || item.educadores > 0,
  );

  if (!hasRegistrations) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] p-4 text-center text-xs text-[var(--ink-muted)]">
        Nenhum novo cadastro registrado nos últimos 6 meses.
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <div
        className="h-56 w-full"
        role="img"
        aria-label="Gráfico de novos cadastros de estudantes e educadores nos últimos 6 meses"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -4, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--chart-grid)"
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              width={36}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [
                Number(value ?? 0).toLocaleString("pt-BR"),
                String(name ?? ""),
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "6px" }} />
            <Bar
              dataKey="estudantes"
              name="Estudantes"
              fill="var(--chart-primary)"
              radius={[6, 6, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="educadores"
              name="Educadores"
              fill="var(--chart-secondary)"
              radius={[6, 6, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="sr-only">
        <table>
          <caption>Novos cadastros por mês</caption>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Estudantes</th>
              <th>Educadores</th>
            </tr>
          </thead>
          <tbody>
            {data.map((bucket) => (
              <tr key={bucket.monthLabel}>
                <td>{bucket.monthLabel}</td>
                <td>{bucket.estudantes}</td>
                <td>{bucket.educadores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface AdminFunnelChartProps {
  data: StageFunnelStep[];
}

export function AdminFunnelChart({ data }: AdminFunnelChartProps) {
  const hasActivity = data.some((step) => step.count > 0);

  if (!hasActivity) {
    return (
      <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] p-4 text-center text-xs text-[var(--ink-muted)]">
        Nenhuma atividade estudantil registrada nas 4 etapas até o momento.
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <div
        className="h-60 w-full"
        role="img"
        aria-label="Gráfico de estudantes com atividade registrada em cada uma das 4 etapas"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 6, right: 16, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--chart-grid)"
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="stage"
              width={92}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [
                Number(value ?? 0).toLocaleString("pt-BR"),
                "Estudantes",
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar
              dataKey="count"
              name="Estudantes"
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
            >
              {data.map((entry) => (
                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="sr-only">
        <table>
          <caption>Estudantes com atividade por etapa</caption>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Estudantes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((step) => (
              <tr key={step.stage}>
                <td>{step.stage}</td>
                <td>{step.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
