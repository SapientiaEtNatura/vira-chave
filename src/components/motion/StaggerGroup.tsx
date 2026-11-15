"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import {
  gsap,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER,
  useGSAP,
} from "@/lib/gsap";

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
}

export function StaggerGroup({ children, className }: StaggerGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = container.querySelectorAll<HTMLElement>("[data-motion-item]");
        if (items.length === 0) return;

        gsap.from(items, {
          y: 16,
          opacity: 0,
          duration: MOTION_DURATION.base,
          ease: MOTION_EASE.enter,
          stagger: MOTION_STAGGER,
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            once: true,
          },
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
