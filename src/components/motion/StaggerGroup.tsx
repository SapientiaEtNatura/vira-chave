"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, MOTION_EASE, useGSAP } from "@/lib/gsap";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
        const items = container.querySelectorAll<HTMLElement>(
          "[data-motion-item]",
        );
        if (items.length === 0) return;

        gsap.from(items, {
          y: 18,
          opacity: 0,
          duration: 0.65,
          ease: MOTION_EASE.enter,
          stagger: 0.08,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: container,
            start: "top 88%",
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
