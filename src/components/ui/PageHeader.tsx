import * as React from "react";
import { cn } from "@/lib/cn";
import { StagePill, type StageKey } from "./StagePill";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  stage?: StageKey;
  stageLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  stage,
  stageLabel,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {stage ? (
          <div>
            <StagePill stage={stage} label={stageLabel} />
          </div>
        ) : null}
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink-primary)] sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-[68ch] text-sm leading-relaxed text-[var(--ink-secondary)] sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
