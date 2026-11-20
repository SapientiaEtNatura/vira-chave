"use client";

import dynamic from "next/dynamic";

export const ClassroomChartsDynamic = dynamic(
  () => import("./ClassroomCharts").then((mod) => mod.ClassroomCharts),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden="true" className="grid gap-6 lg:grid-cols-2">
        <div className="h-[360px] w-full animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70" />
        <div className="h-[360px] w-full animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70" />
      </div>
    ),
  },
);
