import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import * as uiBarrel from "@/components/ui";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { BannerMountains } from "@/components/motion/BannerMountains";
import { FilterGridReveal } from "@/components/motion/FilterGridReveal";
import {
  HeroJourneyCard,
  type HeroJourneyStage,
} from "@/components/motion/HeroJourneyCard";
import { ViraChaveLoader } from "@/components/motion/ViraChaveLoader";

const ROOT = path.resolve(import.meta.dirname, "../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe("Task 7 — Client Bundle Trim, Pure CSS Motion & UI Barrel Cleanup", () => {
  it("PERF-05: isolates Prisma from src/lib/discovery/readiness.ts into readiness-server.ts without 'server-only'", () => {
    const readinessSource = readRepoFile("src/lib/discovery/readiness.ts");
    expect(readinessSource).not.toContain("@/lib/db");
    expect(readinessSource).not.toContain("@prisma/client");
    expect(readinessSource).not.toContain("getStudentProvenPractice");

    const readinessServerSource = readRepoFile(
      "src/lib/discovery/readiness-server.ts",
    );
    expect(readinessServerSource).not.toContain("server-only");
    expect(readinessServerSource).toContain("export async function getStudentProvenPractice");

    const quizClientSource = readRepoFile(
      "src/components/discovery/DiscoveryQuizClient.tsx",
    );
    expect(quizClientSource).not.toContain("readiness-server");

    const descobrirPageSource = readRepoFile(
      "src/app/(app)/app/descobrir/page.tsx",
    );
    expect(descobrirPageSource).toContain("@/lib/discovery/readiness-server");
    expect(descobrirPageSource).toContain("@/components/ui/StageBanner");
  });

  it("PERF-07: removes GSAP and unnecessary 'use client' from ViraChaveLoader, BannerMountains, FilterGridReveal, and HeroJourneyCard", () => {
    const serverMotionFiles = [
      "src/components/motion/ViraChaveLoader.tsx",
      "src/components/motion/BannerMountains.tsx",
      "src/components/motion/HeroJourneyCard.tsx",
    ];

    for (const file of serverMotionFiles) {
      const content = readRepoFile(file);
      expect(content).not.toMatch(/^["']use client["'];/m);
      expect(content).not.toContain("@/lib/gsap");
      expect(content).not.toContain("useGSAP");
    }

    const bannerSource = readRepoFile("src/components/motion/BannerMountains.tsx");
    expect(bannerSource).not.toContain("IntersectionObserver");

    const filterGridSource = readRepoFile(
      "src/components/motion/FilterGridReveal.tsx",
    );
    expect(filterGridSource).not.toContain("@/lib/gsap");
    expect(filterGridSource).not.toContain("useGSAP");
    expect(filterGridSource).toContain("scrollIntoView");
  });

  it("PERF-07: renders CSS-animated motion components preserving accessibility and E2E selectors", () => {
    const loaderHtml = renderToStaticMarkup(
      <ViraChaveLoader size={88} label="Carregando trilha..." />,
    );
    expect(loaderHtml).toContain('role="status"');
    expect(loaderHtml).toContain('aria-live="polite"');
    expect(loaderHtml).toContain('viewBox="1120 40 560 1320"');
    expect(loaderHtml).toContain('width="37"');
    expect(loaderHtml).toContain('height="88"');
    expect(loaderHtml).toContain("<clipPath");
    expect(loaderHtml).toContain("data-speed-line");
    expect(loaderHtml).toContain("vc-loader-key");
    expect(loaderHtml).toContain("vc-loader-cap");
    expect(loaderHtml).toContain("vc-loader-impact-arcs");
    expect(loaderHtml).toContain("Carregando trilha...");

    const mountainsHtml = renderToStaticMarkup(
      <BannerMountains stage="DESCOBRIR" />,
    );
    expect(mountainsHtml).toContain("data-wave-back");
    expect(mountainsHtml).toContain("data-wave-mid");
    expect(mountainsHtml).toContain("data-wave-cutout");
    expect(mountainsHtml).toContain("vc-wave-back");
    expect(mountainsHtml).toContain("vc-wave-mid");
    expect(mountainsHtml).toContain("vc-wave-cutout");

    const filterHtml = renderToStaticMarkup(
      <FilterGridReveal filterKey="tecnologia-dados" className="grid gap-4">
        <div data-filter-card="true">Item 1</div>
        <div data-filter-card="true">Item 2</div>
      </FilterGridReveal>,
    );
    expect(filterHtml).toContain("vc-filter-grid");
    expect(filterHtml).toContain("data-filter-card");

    const heroStages: HeroJourneyStage[] = [
      { key: "DESCOBRIR", title: "Descobrir", iconClasses: "bg-red-50", previewDone: true },
      { key: "APRENDER", title: "Aprender", iconClasses: "bg-blue-50", previewDone: true },
      { key: "EXPERIMENTAR", title: "Experimentar", iconClasses: "bg-amber-50", previewBadge: "Em andamento" },
      { key: "CONSTRUIR", title: "Construir", iconClasses: "bg-green-50", previewLocked: true },
    ];
    const journeyHtml = renderToStaticMarkup(
      <HeroJourneyCard stages={heroStages} />,
    );
    expect(journeyHtml.match(/data-journey-step/g)?.length).toBe(4);
    expect(journeyHtml.match(/data-journey-line/g)?.length).toBe(3);
    expect(journeyHtml).toContain("vc-journey-step");
    expect(journeyHtml).toContain("vc-journey-line");
    expect(journeyHtml).toContain("animation-delay");
  });

  it("PERF-07: defines CSS @keyframes and reduced-motion safeguards with non-zero line scale", () => {
    const css = readRepoFile("src/app/globals.css");
    const requiredClasses = [
      "vc-loader-key",
      "vc-loader-key-reveal",
      "vc-loader-cap",
      "vc-loader-speed-line",
      "vc-loader-impact-arcs",
      "vc-wave-back",
      "vc-wave-mid",
      "vc-wave-cutout",
      "vc-filter-grid > [data-filter-card]",
      "vc-journey-step",
      "vc-journey-line",
    ];

    for (const cls of requiredClasses) {
      expect(css).toContain(cls);
    }

    const reducedMotionMatch = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/,
    );
    expect(reducedMotionMatch).not.toBeNull();
    const reducedBlock = reducedMotionMatch![0];
    for (const cls of requiredClasses) {
      expect(reducedBlock).toContain(cls);
    }
    expect(reducedBlock).toContain("animation: none !important;");

    expect(css).toMatch(/hero-journey-line-enter[\s\S]*scaleY\(0\.15\)/);
  });

  it("PERF-10: removes the 7 heavy widgets from src/components/ui/index.ts and leaves zero barrel imports of them", () => {
    const removedExports = [
      "Avatar",
      "AvatarFallback",
      "AvatarImage",
      "ConfirmDialog",
      "Drawer",
      "DropdownMenu",
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "FileUploadField",
      "StageBanner",
      "Switch",
    ];

    for (const symbol of removedExports) {
      expect(Object.keys(uiBarrel)).not.toContain(symbol);
    }

    const barrelSource = readRepoFile("src/components/ui/index.ts");
    const moduleTargets = Array.from(
      barrelSource.matchAll(/from\s+["']\.\/([^"']+)["']/g),
      (m) => m[1],
    );
    expect(moduleTargets.length).toBeGreaterThan(0);
    for (const mod of moduleTargets) {
      const modSource = readRepoFile(`src/components/ui/${mod}.tsx`);
      expect(modSource).not.toMatch(/^["']use client["'];/m);
    }

    const barrelImportPattern =
      /import\s+[^;]*\b(Avatar|AvatarFallback|AvatarImage|ConfirmDialog|Drawer|DropdownMenu\w*|FileUploadField|StageBanner|Switch)\b[^;]*from\s+["']@\/components\/ui["']/;
    for (const filePath of collectSourceFiles(path.join(ROOT, "src"))) {
      const content = fs.readFileSync(filePath, "utf8");
      expect(content, `Unexpected barrel import in ${filePath}`).not.toMatch(
        barrelImportPattern,
      );
    }
  });

  it("PERF-16 & PERF-18: PreviewBanner is a Server Component and jetbrainsMono has preload: false", () => {
    const previewBannerSource = readRepoFile(
      "src/components/layout/PreviewBanner.tsx",
    );
    expect(previewBannerSource).not.toMatch(/^["']use client["'];/m);

    const studentHtml = renderToStaticMarkup(
      <PreviewBanner mode="ESTUDANTE" />,
    );
    expect(studentHtml).toContain("Visão: Estudante");
    expect(studentHtml).toContain('aria-current="page"');

    const educatorHtml = renderToStaticMarkup(
      <PreviewBanner mode="EDUCADOR" />,
    );
    expect(educatorHtml).toContain("Visão: Educador");

    const layoutSource = readRepoFile("src/app/layout.tsx");
    expect(layoutSource).toMatch(
      /jetbrainsMono\s*=\s*(?:JetBrains_Mono|localFont)\([\s\S]*?preload:\s*false[\s\S]*?\)/,
    );
  });
});
