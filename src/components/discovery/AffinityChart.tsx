"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface AffinityChartDatum {
  slug: string;
  name: string;
  score: number;
}

interface AffinityChartProps {
  data: AffinityChartDatum[];
}

export function AffinityChart({ data }: AffinityChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] p-6 text-center text-sm text-[var(--ink-muted)]">
        Nenhuma área de afinidade disponível para exibição.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="h-80 w-full"
        role="img"
        aria-label="Mapa de afinidades por macroárea"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "var(--chart-axis)", fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
            />
            <Radar
              name="Afinidade"
              dataKey="score"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.3}
            />
            <Tooltip
              formatter={(value) => [`${value ?? 0}%`, "Afinidade"]}
              contentStyle={{
                borderRadius: "0.75rem",
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--ink-primary)",
                fontSize: "0.875rem",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
