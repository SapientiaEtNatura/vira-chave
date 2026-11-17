"use client";

import { useEffect, useId, useRef } from "react";
import type { StageKey } from "@/components/ui/StagePill";
import { gsap, useGSAP } from "@/lib/gsap";

const STAGE_WAVE_COLORS: Record<
  StageKey,
  { main: string; accent: string }
> = {
  DESCOBRIR: {
    main: "var(--stage-discover-ink)",
    accent: "var(--brand-primary)",
  },
  APRENDER: {
    main: "var(--brand-primary)",
    accent: "var(--stage-build-ink)",
  },
  EXPERIMENTAR: {
    main: "var(--stage-experiment-ink)",
    accent: "var(--brand-accent)",
  },
  CONSTRUIR: {
    main: "var(--stage-build-ink)",
    accent: "var(--brand-primary)",
  },
};

interface BannerMountainsProps {
  stage: StageKey;
}

export function BannerMountains({ stage }: BannerMountainsProps) {
  const uid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const colors = STAGE_WAVE_COLORS[stage];

  const mainGradId = `wave-main-${uid}`;
  const accentGradId = `wave-accent-${uid}`;

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const backWave = container.querySelector<SVGSVGElement>("[data-wave-back]");
        const midWave = container.querySelector<SVGSVGElement>("[data-wave-mid]");
        const cutoutWave = container.querySelector<SVGSVGElement>("[data-wave-cutout]");

        const tl = gsap.timeline();

        if (backWave) {
          tl.to(
            backWave,
            {
              xPercent: -4,
              duration: 12,
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
              duration: 9,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            },
            0,
          );
        }

        if (cutoutWave) {
          tl.to(
            cutoutWave,
            {
              xPercent: -3.5,
              duration: 11,
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
      className="pointer-events-none absolute -bottom-px -left-px -right-px z-[1] h-20 overflow-hidden sm:h-24"
    >
      <svg
        data-wave-back
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 -left-[10%] h-full w-[120%]"
      >
        <defs>
          <linearGradient id={accentGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={colors.accent} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path
          d="M0,78 C210,48 410,92 650,64 C890,36 1080,14 1260,36 C1340,46 1400,62 1440,56 L1440,120 L0,120 Z"
          fill={`url(#${accentGradId})`}
        />
      </svg>

      <svg
        data-wave-mid
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 -left-[10%] h-full w-[120%]"
      >
        <defs>
          <linearGradient id={mainGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.main} stopOpacity="0.34" />
            <stop offset="100%" stopColor={colors.main} stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <path
          d="M0,58 C160,26 320,86 520,66 C710,48 860,88 1060,52 C1210,24 1340,58 1440,44 L1440,120 L0,120 Z"
          fill={`url(#${mainGradId})`}
        />
      </svg>

      <svg
        data-wave-cutout
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 -left-[10%] h-full w-[120%]"
      >
        <path
          d="M0,84 C190,116 360,58 590,82 C810,104 970,52 1170,76 C1300,92 1385,78 1440,68 L1440,120 L0,120 Z"
          fill="var(--bg-canvas)"
        />
      </svg>
    </div>
  );
}
