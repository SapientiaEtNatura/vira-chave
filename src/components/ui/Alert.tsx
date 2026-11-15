import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const VARIANT_CONFIG: Record<
  AlertVariant,
  {
    classes: string;
    role: "alert" | "status";
    Icon: typeof Info;
  }
> = {
  info: {
    classes:
      "bg-[var(--status-info-bg)] text-[var(--status-info-ink)] border-[var(--status-info-border)]",
    role: "status",
    Icon: Info,
  },
  success: {
    classes:
      "bg-[var(--status-success-bg)] text-[var(--status-success-ink)] border-[var(--status-success-border)]",
    role: "status",
    Icon: CheckCircle2,
  },
  warning: {
    classes:
      "bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)] border-[var(--status-warning-border)]",
    role: "alert",
    Icon: AlertTriangle,
  },
  danger: {
    classes:
      "bg-[var(--status-danger-bg)] text-[var(--status-danger-ink)] border-[var(--status-danger-border)]",
    role: "alert",
    Icon: AlertCircle,
  },
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export function Alert({
  variant = "info",
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const { classes, role, Icon } = VARIANT_CONFIG[variant];

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm",
        classes,
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="font-semibold leading-5">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
