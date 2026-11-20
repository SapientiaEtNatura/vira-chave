"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export interface AffinityPreviewRadarDatum {
  name: string;
  score: number;
}

export interface AffinityPreviewRadarProps {
  data: AffinityPreviewRadarDatum[];
  prefersReduced: boolean;
}

export function AffinityPreviewRadar({
  data,
  prefersReduced,
}: AffinityPreviewRadarProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="66%" data={data}>
        <PolarGrid stroke="var(--chart-grid)" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: "var(--chart-axis)", fontSize: 11, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "var(--chart-axis)", fontSize: 9 }}
        />
        <Radar
          name="Afinidade"
          dataKey="score"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.28}
          isAnimationActive={!prefersReduced}
          animationDuration={650}
          animationEasing="ease-out"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
