"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface FilterGridRevealProps {
  filterKey: string;
  children: ReactNode;
  className?: string;
}

export function FilterGridReveal({
  filterKey,
  children,
  className,
}: FilterGridRevealProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const prevKeyRef = useRef(filterKey);

  useEffect(() => {
    if (prevKeyRef.current === filterKey) return;
    prevKeyRef.current = filterKey;

    const el = gridRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < 80) {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [filterKey]);

  return (
    <div className="min-h-[45dvh]">
      <div
        key={filterKey}
        ref={gridRef}
        className={cn("vc-filter-grid", className)}
      >
        {children}
      </div>
    </div>
  );
}
