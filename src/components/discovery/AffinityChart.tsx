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
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
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
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "#334155", fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Radar
              name="Afinidade"
              dataKey="score"
              stroke="#4f46e5"
              fill="#6366f1"
              fillOpacity={0.35}
            />
            <Tooltip
              formatter={(value) => [`${value ?? 0}%`, "Afinidade"]}
              contentStyle={{
                borderRadius: "0.75rem",
                borderColor: "#e2e8f0",
                fontSize: "0.875rem",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
