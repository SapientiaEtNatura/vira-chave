"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { gsap, MOTION_EASE, useGSAP } from "@/lib/gsap";
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

  useGSAP(
    () => {
      const container = gridRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = container.querySelectorAll<HTMLElement>("[data-filter-card]");
        if (items.length === 0) return;

        gsap.from(items, {
          y: 10,
          opacity: 0,
          duration: 0.24,
          ease: MOTION_EASE.enter,
          stagger: 0.04,
          clearProps: "transform,opacity",
        });
      });
    },
    { scope: gridRef, dependencies: [filterKey] },
  );

  return (
    <div ref={gridRef} className={cn("min-h-[45dvh]", className)}>
      {children}
    </div>
  );
}
