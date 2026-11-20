"use client";

import { useEffect, useState } from "react";
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

function formatAxisLabel(label: string): string {
  if (label.length <= 15) return label;
  const firstPart = label.split(/\s*[&e]\s*/i)[0]?.trim();
  if (firstPart && firstPart.length >= 4 && firstPart.length <= 16) {
    return firstPart;
  }
  return `${label.slice(0, 14)}…`;
}

export function AffinityChart({ data }: AffinityChartProps) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] p-6 text-center text-sm text-[var(--ink-muted)]">
        Nenhuma área de afinidade disponível para exibição.
      </div>
    );
  }

  const hasProvenPractice = data.some((item) => (item.provenScore ?? 0) > 0);
  const chartData = data.map((item) => ({
    ...item,
    shortName: formatAxisLabel(item.name),
  }));

  return (
    <div className="relative w-full min-w-0 space-y-2 overflow-x-clip">
      <div
        className="h-72 w-full min-w-0 sm:h-[22rem]"
        role="img"
        aria-label="Mapa de afinidades por área comparando afinidade nos cenários e prática comprovada"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="48%" outerRadius="64%" data={chartData}>
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis
              dataKey="shortName"
              tick={{ fill: "var(--chart-axis)", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
            />
            <Radar
              name="Afinidade nos cenários"
              dataKey="score"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.28}
              isAnimationActive={!prefersReduced}
            />
            {hasProvenPractice ? (
              <Radar
                name="Prática comprovada"
                dataKey="provenScore"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.2}
                strokeDasharray="4 3"
                isAnimationActive={!prefersReduced}
              />
            ) : null}
            <Legend
              wrapperStyle={{
                fontSize: "0.75rem",
                paddingTop: "0.5rem",
              }}
            />
            <Tooltip
              labelFormatter={(_label, payload) => {
                const fullName = payload?.[0]?.payload?.name;
                return typeof fullName === "string" ? fullName : "";
              }}
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

      {!hasProvenPractice ? (
        <p className="text-center text-xs text-[var(--ink-muted)]">
          A camada de <strong>Prática comprovada</strong> aparece no gráfico
          assim que você concluir um curso ou enviar seu primeiro desafio.
        </p>
      ) : null}

      <div className="sr-only">
        <table>
          <caption>Pontuação de afinidade e prática comprovada por área</caption>
          <thead>
            <tr>
              <th>Área</th>
              <th>Afinidade nos cenários</th>
              <th>Prática comprovada</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.slug}>
                <td>{item.name}</td>
                <td>{item.score}%</td>
                <td>{item.provenScore ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
