"use client";

import dynamic from "next/dynamic";

export const MonthlyRegistrationsChartDynamic = dynamic(
  () =>
    import("./AdminCharts").then((mod) => mod.AdminRegistrationsChart),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-56 w-full animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70"
      />
    ),
  },
);

export const StageFunnelChartDynamic = dynamic(
  () => import("./AdminCharts").then((mod) => mod.AdminFunnelChart),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-60 w-full animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70"
      />
    ),
  },
);
