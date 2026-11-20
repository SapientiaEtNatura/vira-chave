import Link from "next/link";
import { Sparkles } from "lucide-react";

export interface MacroAreaFilterItem {
  id: string;
  slug: string;
  name: string;
  count: number;
}

export interface MacroAreaFilterBarProps {
  basePath: string;
  ariaLabel: string;
  activeArea: string;
  items: MacroAreaFilterItem[];
  recommendedSlugs: string[];
}

const CHIP_BASE_CLASS =
  "min-h-11 inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors duration-150";
const CHIP_ACTIVE_CLASS =
  "border-[color-mix(in_srgb,var(--brand-primary)_28%,var(--brand-primary-border))] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]";
const CHIP_INACTIVE_CLASS =
  "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]";

export function MacroAreaFilterBar({
  basePath,
  ariaLabel,
  activeArea,
  items,
  recommendedSlugs,
}: MacroAreaFilterBarProps) {
  const visibleItems = items.filter((item) => item.count > 0);
  const totalCount = visibleItems.reduce((sum, item) => sum + item.count, 0);
  const recommendedCount = visibleItems
    .filter((item) => recommendedSlugs.includes(item.slug))
    .reduce((sum, item) => sum + item.count, 0);
  const isRecommendedFilter = activeArea === "recomendadas";

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center gap-2">
      <Link
        href={basePath}
        scroll={false}
        aria-current={!activeArea ? "page" : undefined}
        className={`${CHIP_BASE_CLASS} ${!activeArea ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`}
      >
        <span>Todas as áreas</span>
        <span className="font-mono text-xs tabular-nums">({totalCount})</span>
      </Link>

      {recommendedSlugs.length > 0 && recommendedCount > 0 ? (
        <Link
          href={`${basePath}?area=recomendadas`}
          scroll={false}
          aria-current={isRecommendedFilter ? "page" : undefined}
          className={`${CHIP_BASE_CLASS} ${isRecommendedFilter ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Para você</span>
          <span className="font-mono text-xs tabular-nums">
            ({recommendedCount})
          </span>
        </Link>
      ) : null}

      {visibleItems.map((item) => {
        const isActive = activeArea === item.slug;
        return (
          <Link
            key={item.id}
            href={`${basePath}?area=${encodeURIComponent(item.slug)}`}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={`${CHIP_BASE_CLASS} ${isActive ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`}
          >
            <span>{item.name}</span>
            <span className="font-mono text-xs tabular-nums">
              ({item.count})
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
