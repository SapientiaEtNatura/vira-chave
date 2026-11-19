"use client";

import {
  Legend,
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
  provenScore?: number;
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
        className="h-80 w-full sm:h-[22rem]"
        role="img"
        aria-label="Mapa de afinidades por macroárea com camadas de afinidade situacional e prática comprovada"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="48%" outerRadius="68%" data={data}>
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
              name="Afinidade situacional"
              dataKey="score"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.28}
            />
            <Radar
              name="Prática comprovada"
              dataKey="provenScore"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.2}
              strokeDasharray="4 3"
            />
            <Legend
              wrapperStyle={{
                fontSize: "0.75rem",
                paddingTop: "0.5rem",
              }}
            />
            <Tooltip
              formatter={(value, name) => [`${value ?? 0}%`, String(name ?? "")]}
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
