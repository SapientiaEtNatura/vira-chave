"use client";

import { useEffect, useRef } from "react";
import type { StageKey } from "@/components/ui/StagePill";
import { gsap, useGSAP } from "@/lib/gsap";

const STAGE_WAVE_COLORS: Record<
  StageKey,
  { back: string; mid: string; front: string }
> = {
  DESCOBRIR: {
    back: "var(--stage-discover-border)",
    mid: "var(--stage-discover-ink)",
    front: "var(--brand-primary)",
  },
  APRENDER: {
    back: "var(--stage-learn-border)",
    mid: "var(--stage-learn-ink)",
    front: "var(--brand-primary)",
  },
  EXPERIMENTAR: {
    back: "var(--stage-experiment-border)",
    mid: "var(--stage-experiment-ink)",
    front: "var(--brand-accent)",
  },
  CONSTRUIR: {
    back: "var(--stage-build-border)",
    mid: "var(--stage-build-ink)",
    front: "var(--brand-primary)",
  },
};

interface BannerMountainsProps {
  stage: StageKey;
}

export function BannerMountains({ stage }: BannerMountainsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const colors = STAGE_WAVE_COLORS[stage];

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const backWave = container.querySelector<SVGSVGElement>("[data-wave-back]");
        const midWave = container.querySelector<SVGSVGElement>("[data-wave-mid]");
        const frontWave = container.querySelector<SVGSVGElement>("[data-wave-front]");

        const tl = gsap.timeline();

        if (backWave) {
          tl.to(
            backWave,
            {
              xPercent: -4,
              duration: 13,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            },
            0,
          );
        }

        if (midWave) {
          tl.to(
            midWave,
            {
              xPercent: 4.5,
              duration: 10,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            },
            0,
          );
        }

        if (frontWave) {
          tl.to(
            frontWave,
            {
              xPercent: -5,
              duration: 7,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            },
            0,
          );
        }

        timelineRef.current = tl;

        return () => {
          timelineRef.current = null;
        };
      });
    },
    { scope: containerRef },
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const tl = timelineRef.current;
        if (!tl) return;
        if (entry?.isIntersecting) {
          tl.play();
        } else {
          tl.pause();
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden sm:h-24"
    >
      <svg
        data-wave-back
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 -left-[10%] h-full w-[120%]"
      >
        <path
          d="M0,74 C240,26 460,96 740,56 C1020,16 1220,82 1440,42 L1440,120 L0,120 Z"
          fill={colors.back}
          fillOpacity="0.48"
        />
      </svg>

      <svg
        data-wave-mid
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 -left-[10%] h-full w-[120%]"
      >
        <path
          d="M0,88 C280,44 520,104 820,66 C1100,30 1270,90 1440,58 L1440,120 L0,120 Z"
          fill={colors.mid}
          fillOpacity="0.16"
        />
      </svg>

      <svg
        data-wave-front
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 -left-[10%] h-full w-[120%]"
      >
        <path
          d="M0,96 C320,64 560,112 880,78 C1160,48 1310,98 1440,76 L1440,120 L0,120 Z"
          fill={colors.front}
          fillOpacity="0.14"
        />
      </svg>
    </div>
  );
}
