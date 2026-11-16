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
  boxShadow: "0 4px 12px rgba(16, 24, 40, 0.06)",
};

export interface AdminRegistrationsChartProps {
  data: MonthlyRegistrationBucket[];
}

export function AdminRegistrationsChart({ data }: AdminRegistrationsChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
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
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "6px" }} />
          <Bar
            dataKey="estudantes"
            name="Estudantes"
            fill="var(--chart-2)"
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="educadores"
            name="Educadores"
            fill="var(--chart-3)"
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface AdminFunnelChartProps {
  data: StageFunnelStep[];
}

export function AdminFunnelChart({ data }: AdminFunnelChartProps) {
  return (
    <div className="h-60 w-full">
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
            width={88}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
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
  );
}
