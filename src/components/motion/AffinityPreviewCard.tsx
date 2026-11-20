"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
}

const AREAS: AreaConfig[] = [
  {
    slug: "comunicacao",
    chartLabel: "Comunicação",
    barLabel: "Comunicação & Conteúdo",
    barColor: "bg-[var(--brand-primary)]",
    initialScore: 74,
  },
  {
    slug: "design",
    chartLabel: "Design",
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
  },
  {
    slug: "saude",
    chartLabel: "Saúde",
    barLabel: "Saúde & Ciência",
    barColor: "bg-[var(--stage-build-ink)]",
    initialScore: 71,
  },
  {
    slug: "sustentabilidade",
    chartLabel: "Meio Ambiente",
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
  },
];

const INITIAL_SCORES: Record<string, number> = Object.fromEntries(
  AREAS.map((area) => [area.slug, area.initialScore]),
);

const PRESET_PROFILES: Array<{
  id: string;
  label: string;
  scores?: Record<string, number>;
}> = [
  { id: "auto", label: "Dinâmico" },
  {
    id: "tech",
    label: "Tech & Dados",
    scores: {
      comunicacao: 60,
      design: 76,
      negocios: 64,
      saude: 55,
      sustentabilidade: 58,
      tecnologia: 92,
    },
  },
  {
    id: "criativo",
    label: "Comunicação",
    scores: {
      comunicacao: 90,
      design: 88,
      negocios: 72,
      saude: 52,
      sustentabilidade: 66,
      tecnologia: 64,
    },
  },
  {
    id: "impacto",
    label: "Impacto & Saúde",
    scores: {
      comunicacao: 74,
      design: 56,
      negocios: 78,
      saude: 89,
      sustentabilidade: 91,
      tecnologia: 58,
    },
  },
];

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
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  const [scores, setScores] = useState<Record<string, number>>(INITIAL_SCORES);
  const [activePreset, setActivePreset] = useState<string>("auto");
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

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
      for (const tween of tweensRef.current) {
        tween.kill();
      }
      tweensRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isVisible || prefersReduced || activePreset !== "auto") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setScores((prev) => {
        const next: Record<string, number> = {};
        for (const area of AREAS) {
          next[area.slug] = nextRandomScore(
            prev[area.slug] ?? area.initialScore,
          );
        }
        return next;
      });
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isVisible, prefersReduced, activePreset]);

  const topAreas = useMemo(() => {
    return [...AREAS]
      .sort(
        (a, b) =>
          (scores[b.slug] ?? b.initialScore) -
          (scores[a.slug] ?? a.initialScore),
      )
      .slice(0, 3);
  }, [scores]);

  useEffect(() => {
    for (const tween of tweensRef.current) {
      tween.kill();
    }
    tweensRef.current = [];

    if (prefersReduced) {
      for (const area of topAreas) {
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

    const nextTweens: gsap.core.Tween[] = [];

    for (const area of topAreas) {
      const targetScore = scores[area.slug] ?? area.initialScore;
      const barEl = barRefs.current[area.slug];
      const numEl = numberRefs.current[area.slug];

      if (barEl) {
        nextTweens.push(
          gsap.to(barEl, {
            scaleX: targetScore / 100,
            duration: 0.65,
            ease: MOTION_EASE.enter,
            transformOrigin: "left center",
          }),
        );
      }

      if (numEl) {
        const counter = {
          val: displayValuesRef.current[area.slug] ?? targetScore,
        };
        nextTweens.push(
          gsap.to(counter, {
            val: targetScore,
            duration: 0.65,
            ease: MOTION_EASE.enter,
            onUpdate: () => {
              const rounded = Math.round(counter.val);
              displayValuesRef.current[area.slug] = rounded;
              numEl.textContent = `${rounded}%`;
            },
          }),
        );
      }
    }

    tweensRef.current = nextTweens;
  }, [scores, prefersReduced, topAreas]);

  const chartData = AREAS.map((area) => ({
    name: area.chartLabel,
    score: scores[area.slug] ?? area.initialScore,
  }));

  function handleSelectPreset(preset: (typeof PRESET_PROFILES)[number]) {
    setActivePreset(preset.id);
    if (preset.scores) {
      setScores(preset.scores);
    }
  }

  return (
    <div ref={rootRef} className="space-y-4">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Simular perfis de afinidade"
      >
        {PRESET_PROFILES.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              aria-pressed={isActive}
              className={`min-h-11 rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold transition-colors sm:min-h-9 sm:px-3 ${
                isActive
                  ? "border-[color-mix(in_srgb,var(--stage-discover-ink)_28%,var(--stage-discover-border))] bg-[var(--stage-discover-bg)] text-[var(--stage-discover-ink)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div
        className="h-60 w-full"
        role="img"
        aria-label="Prévia interativa do mapa de afinidades em 6 áreas"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="66%" data={chartData}>
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
              fillOpacity={0.28}
              isAnimationActive={!prefersReduced}
              animationDuration={650}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="sr-only">
        <table>
          <caption>Pontuação simulada de afinidade por área</caption>
          <thead>
            <tr>
              <th>Área</th>
              <th>Afinidade</th>
            </tr>
          </thead>
          <tbody>
            {AREAS.map((area) => (
              <tr key={area.slug}>
                <td>{area.barLabel}</td>
                <td>{scores[area.slug] ?? area.initialScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-4">
        <p className="text-xs font-semibold text-[var(--ink-muted)]">
          Áreas em destaque neste perfil
        </p>
        {topAreas.map((area) => {
          const currentScore = scores[area.slug] ?? area.initialScore;
          return (
            <div key={area.slug} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-primary)]">
                <span>{area.barLabel}</span>
                <span
                  ref={(el) => {
                    numberRefs.current[area.slug] = el;
                  }}
                  className="font-mono tabular-nums text-[var(--ink-muted)]"
                >
                  {currentScore}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                <div
                  ref={(el) => {
                    barRefs.current[area.slug] = el;
                  }}
                  style={{
                    transform: `scaleX(${currentScore / 100})`,
                    transformOrigin: "left center",
                  }}
                  className={`h-full w-full rounded-full ${area.barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
