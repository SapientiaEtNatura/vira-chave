"use client";

import { useEffect, useRef, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { gsap, MOTION_EASE } from "@/lib/gsap";

interface AreaConfig {
  slug: string;
  chartLabel: string;
  barLabel: string;
  barColor: string;
  initialScore: number;
  showInBars?: boolean;
}

const AREAS: AreaConfig[] = [
  {
    slug: "comunicacao",
    chartLabel: "Comunicação",
    barLabel: "Comunicação & Conteúdo",
    barColor: "bg-[var(--brand-primary)]",
    initialScore: 74,
    showInBars: true,
  },
  {
    slug: "design",
    chartLabel: "Design Digital",
    barLabel: "Design Digital",
    barColor: "bg-[var(--stage-discover-ink)]",
    initialScore: 68,
  },
  {
    slug: "negocios",
    chartLabel: "Negócios",
    barLabel: "Negócios & Impacto",
    barColor: "bg-[var(--stage-learn-ink)]",
    initialScore: 62,
    showInBars: true,
  },
  {
    slug: "saude",
    chartLabel: "Saúde & Ciência",
    barLabel: "Saúde & Ciência",
    barColor: "bg-[var(--stage-build-ink)]",
    initialScore: 71,
  },
  {
    slug: "sustentabilidade",
    chartLabel: "Sustentabilidade",
    barLabel: "Sustentabilidade",
    barColor: "bg-[var(--stage-build-ink)]",
    initialScore: 58,
  },
  {
    slug: "tecnologia",
    chartLabel: "Tecnologia",
    barLabel: "Tecnologia & Dados",
    barColor: "bg-[var(--stage-discover-ink)]",
    initialScore: 86,
    showInBars: true,
  },
];

const BAR_AREAS = [
  AREAS[5], // Tecnologia & Dados
  AREAS[0], // Comunicação & Conteúdo
  AREAS[2], // Negócios & Impacto
];

const INITIAL_SCORES: Record<string, number> = Object.fromEntries(
  AREAS.map((area) => [area.slug, area.initialScore]),
);

function nextRandomScore(current: number): number {
  const delta = Math.floor(Math.random() * 35) - 17;
  const candidate = Math.max(42, Math.min(96, current + delta));
  return Math.abs(candidate - current) < 6
    ? Math.max(42, Math.min(96, current + (current > 70 ? -14 : 14)))
    : candidate;
}

export function AffinityPreviewCard() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const numberRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const displayValuesRef = useRef<Record<string, number>>({ ...INITIAL_SCORES });

  const [scores, setScores] = useState<Record<string, number>>(INITIAL_SCORES);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const onMediaChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };
    mediaQuery.addEventListener("change", onMediaChange);

    const el = rootRef.current;
    const observer =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              setIsVisible(entry?.isIntersecting ?? false);
            },
            { threshold: 0.2 },
          )
        : null;

    if (el && observer) {
      observer.observe(el);
    }

    return () => {
      mediaQuery.removeEventListener("change", onMediaChange);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || prefersReduced) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setScores((prev) => {
        const next: Record<string, number> = {};
        for (const area of AREAS) {
          next[area.slug] = nextRandomScore(prev[area.slug] ?? area.initialScore);
        }
        return next;
      });
    }, 1900);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isVisible, prefersReduced]);

  useEffect(() => {
    if (prefersReduced) {
      for (const area of BAR_AREAS) {
        const score = scores[area.slug] ?? area.initialScore;
        const barEl = barRefs.current[area.slug];
        const numEl = numberRefs.current[area.slug];
        if (barEl) {
          gsap.set(barEl, { scaleX: score / 100 });
        }
        if (numEl) {
          numEl.textContent = `${score}%`;
        }
        displayValuesRef.current[area.slug] = score;
      }
      return;
    }

    const ctx = gsap.context(() => {
      for (const area of BAR_AREAS) {
        const targetScore = scores[area.slug] ?? area.initialScore;
        const barEl = barRefs.current[area.slug];
        const numEl = numberRefs.current[area.slug];

        if (barEl) {
          gsap.to(barEl, {
            scaleX: targetScore / 100,
            duration: 0.65,
            ease: MOTION_EASE.enter,
            transformOrigin: "left center",
          });
        }

        if (numEl) {
          const counter = { val: displayValuesRef.current[area.slug] ?? targetScore };
          gsap.to(counter, {
            val: targetScore,
            duration: 0.65,
            ease: MOTION_EASE.enter,
            onUpdate: () => {
              const rounded = Math.round(counter.val);
              displayValuesRef.current[area.slug] = rounded;
              numEl.textContent = `${rounded}%`;
            },
          });
        }
      }
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [scores, prefersReduced]);

  const chartData = AREAS.map((area) => ({
    name: area.chartLabel,
    score: scores[area.slug] ?? area.initialScore,
  }));

  return (
    <div ref={rootRef} className="space-y-4">
      <div
        className="h-60 w-full"
        role="img"
        aria-label="Prévia animada do mapa de afinidades por macroárea"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="64%" data={chartData}>
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "var(--chart-axis)", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "var(--chart-axis)", fontSize: 9 }}
            />
            <Radar
              name="Afinidade"
              dataKey="score"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.3}
              isAnimationActive={!prefersReduced}
              animationDuration={650}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4">
        {BAR_AREAS.map((area) => (
          <div key={area.slug} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-primary)]">
              <span>{area.barLabel}</span>
              <span
                ref={(el) => {
                  numberRefs.current[area.slug] = el;
                }}
                className="font-mono text-[var(--ink-muted)]"
              >
                {area.initialScore}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
              <div
                ref={(el) => {
                  barRefs.current[area.slug] = el;
                }}
                style={{
                  transform: `scaleX(${area.initialScore / 100})`,
                  transformOrigin: "left center",
                }}
                className={`h-full w-full rounded-full ${area.barColor}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
