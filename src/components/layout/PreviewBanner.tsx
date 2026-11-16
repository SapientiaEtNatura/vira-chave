"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export type PreviewMode = "ESTUDANTE" | "EDUCADOR";

export interface PreviewBannerProps {
  mode: PreviewMode;
  className?: string;
}

export function PreviewBanner({ mode, className }: PreviewBannerProps) {
  const modeLabel = mode === "ESTUDANTE" ? "Preview: Estudante" : "Preview: Educador";

  return (
    <div
      role="region"
      aria-label="Barra de modo preview administrativo"
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center justify-between gap-2 bg-[var(--brand-primary)] px-4 py-1.5 text-xs text-white",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Badge
          variant="warning"
          className="border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] font-semibold text-[var(--brand-accent-ink)]"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{modeLabel}</span>
        </Badge>
        <span className="hidden text-white/90 sm:inline">
          Visualizando a experiência como administrador
        </span>
      </div>

      <div className="flex items-center gap-2">
        <nav aria-label="Alternar modo preview" className="flex items-center gap-1">
          <Link
            href="/app"
            aria-current={mode === "ESTUDANTE" ? "page" : undefined}
            className={cn(
              "inline-flex min-h-7 items-center rounded-md px-2.5 py-1 font-medium transition-colors duration-150",
              mode === "ESTUDANTE"
                ? "bg-white/20 text-white"
                : "text-white/85 hover:bg-white/10 hover:text-white",
            )}
          >
            Estudante
          </Link>
          <Link
            href="/educador"
            aria-current={mode === "EDUCADOR" ? "page" : undefined}
            className={cn(
              "inline-flex min-h-7 items-center rounded-md px-2.5 py-1 font-medium transition-colors duration-150",
              mode === "EDUCADOR"
                ? "bg-white/20 text-white"
                : "text-white/85 hover:bg-white/10 hover:text-white",
            )}
          >
            Educador
          </Link>
        </nav>

        <Link
          href="/admin"
          className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-white px-2.5 py-1 font-semibold text-[var(--brand-primary)] transition-colors duration-150 hover:bg-[var(--brand-primary-soft)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Voltar ao Admin</span>
        </Link>
      </div>
    </div>
  );
}
