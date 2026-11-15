"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import {
  gsap,
  MOTION_EASE,
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
          y: 20,
          opacity: 0,
          duration: 0.7,
          ease: MOTION_EASE.enter,
          stagger: 0.1,
          scrollTrigger: {
            trigger: container,
            start: "top 62%",
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
