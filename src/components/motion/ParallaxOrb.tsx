"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface ParallaxOrbProps {
  className?: string;
  offsetY?: number;
}

export function ParallaxOrb({ className, offsetY = -24 }: ParallaxOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = orbRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(el, {
          y: offsetY,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      });
    },
    { scope: orbRef },
  );

  return <div ref={orbRef} aria-hidden="true" className={className} />;
}
