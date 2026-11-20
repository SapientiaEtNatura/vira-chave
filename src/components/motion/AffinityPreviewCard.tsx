"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

const RadarPlaceholder = () => (
  <div
    aria-hidden="true"
    className="h-full w-full animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/70"
  />
);

const AffinityPreviewRadar = dynamic(
  () =>
    import("./AffinityPreviewRadar").then((mod) => mod.AffinityPreviewRadar),
  {
    ssr: false,
    loading: () => <RadarPlaceholder />,
  },
);

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

  const [scores, setScores] = useState<Record<string, number>>(INITIAL_SCORES);
  const [activePreset, setActivePreset] = useState<string>("auto");
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoadRadar, setShouldLoadRadar] = useState(false);
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
    if (!el || typeof IntersectionObserver === "undefined") {
      setShouldLoadRadar(true);
      return () => {
        mediaQuery.removeEventListener("change", onMediaChange);
      };
    }

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadRadar(true);
          preloadObserver.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false);
      },
      { threshold: 0.2 },
    );

    preloadObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      mediaQuery.removeEventListener("change", onMediaChange);
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
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

  const chartData = AREAS.map((area) => ({
    name: area.chartLabel,
    score: scores[area.slug] ?? area.initialScore,
  }));

  function handleSelectPreset(preset: (typeof PRESET_PROFILES)[number]) {
    setShouldLoadRadar(true);
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
        {shouldLoadRadar ? (
          <AffinityPreviewRadar
            data={chartData}
            prefersReduced={prefersReduced}
          />
        ) : (
          <RadarPlaceholder />
        )}
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
                <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                  {currentScore}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                <div
                  style={{ width: `${currentScore}%` }}
                  className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${area.barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
