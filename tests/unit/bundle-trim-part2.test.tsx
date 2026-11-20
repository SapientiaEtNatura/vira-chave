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

vi.mock("next/navigation", () => ({
  usePathname: () => "/educador",
}));

import { AppNav } from "@/components/layout/AppNav";
import { AffinityPreviewCard } from "@/components/motion/AffinityPreviewCard";

const ROOT = path.resolve(import.meta.dirname, "../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Task 8 — Dynamic Recharts, Dock Radix Isolation & Admin Search Abort", () => {
  it("PERF-06: removes static Recharts and GSAP imports from AffinityPreviewCard and renders static card shell + CSS bar transitions", () => {
    const cardSource = readRepoFile(
      "src/components/motion/AffinityPreviewCard.tsx",
    );
    expect(cardSource).not.toContain("recharts");
    expect(cardSource).not.toContain("@/lib/gsap");
    expect(cardSource).toContain("next/dynamic");
    expect(cardSource).toContain("ssr: false");
    expect(cardSource).toContain('rootMargin: "200px"');
    expect(cardSource).toContain(
      "transition-[width] duration-500 motion-reduce:transition-none",
    );

    const radarSource = readRepoFile(
      "src/components/motion/AffinityPreviewRadar.tsx",
    );
    expect(radarSource).toMatch(/^["']use client["'];/m);
    expect(radarSource).toContain("from \"recharts\"");
    expect(radarSource).toContain("RadarChart");

    const html = renderToStaticMarkup(<AffinityPreviewCard />);
    expect(html).toContain("Dinâmico");
    expect(html).toContain("Tech &amp; Dados");
    expect(html).toContain("Áreas em destaque neste perfil");
    expect(html).toContain("Tecnologia &amp; Dados");
    expect(html).toContain("transition-[width] duration-500 motion-reduce:transition-none");
    expect(html).not.toContain("recharts-wrapper");
  });

  it("PERF-06: lazy-loads Discovery, Admin, and Classroom chart/deck components with ssr: false", () => {
    const discoveryQuizSource = readRepoFile(
      "src/components/discovery/DiscoveryQuizClient.tsx",
    );
    expect(discoveryQuizSource).not.toMatch(
      /import\s*\{[^}]*AffinityChart[^}]*\}\s*from/,
    );
    expect(discoveryQuizSource).not.toMatch(
      /import\s*\{[^}]*ScenarioFlashcardDeck[^}]*\}\s*from/,
    );
    expect(discoveryQuizSource).toContain("next/dynamic");
    expect(discoveryQuizSource).toContain("ssr: false");

    const adminChartsDynamic = readRepoFile(
      "src/components/admin/AdminChartsDynamic.tsx",
    );
    expect(adminChartsDynamic).toMatch(/^["']use client["'];/m);
    expect(adminChartsDynamic).toContain("MonthlyRegistrationsChartDynamic");
    expect(adminChartsDynamic).toContain("StageFunnelChartDynamic");
    expect(adminChartsDynamic).toContain("ssr: false");

    const adminPageSource = readRepoFile("src/app/(admin)/admin/page.tsx");
    expect(adminPageSource).toContain("@/components/admin/AdminChartsDynamic");
    expect(adminPageSource).not.toContain("@/components/admin/AdminCharts\"");

    const classroomChartsDynamic = readRepoFile(
      "src/components/educator/ClassroomChartsDynamic.tsx",
    );
    expect(classroomChartsDynamic).toMatch(/^["']use client["'];/m);
    expect(classroomChartsDynamic).toContain("ClassroomChartsDynamic");
    expect(classroomChartsDynamic).toContain("ssr: false");

    const classroomPageSource = readRepoFile(
      "src/app/(educator)/educador/turmas/[id]/page.tsx",
    );
    expect(classroomPageSource).toContain(
      "@/components/educator/ClassroomChartsDynamic",
    );
    expect(classroomPageSource).not.toContain(
      "@/components/educator/ClassroomCharts\"",
    );
  });

  it("PERF-11: isolates Radix DropdownMenu into DockAccountMenu, drops Avatar, and dynamic-loads it only for variant='dock'", () => {
    const appNavSource = readRepoFile("src/components/layout/AppNav.tsx");
    expect(appNavSource).not.toContain("radix-ui");
    expect(appNavSource).not.toContain("@/components/ui/dropdown-menu");
    expect(appNavSource).not.toContain("@/components/ui/avatar");
    expect(appNavSource).toContain("./DockAccountMenu");
    expect(appNavSource).toContain("ssr: false");

    const dockMenuSource = readRepoFile(
      "src/components/layout/DockAccountMenu.tsx",
    );
    expect(dockMenuSource).toMatch(/^["']use client["'];/m);
    expect(dockMenuSource).toContain("@/components/ui/dropdown-menu");
    expect(dockMenuSource).not.toContain("@/components/ui/avatar");
    expect(dockMenuSource).toContain("Opções da conta");
    expect(dockMenuSource).toContain("Minha conta");
    expect(dockMenuSource).toContain("Fixar menu");
    expect(dockMenuSource).toContain("Desafixar menu");
    expect(dockMenuSource).toContain("Painel Admin");
    expect(dockMenuSource).toContain("Sair da conta");

    const sidebarHtml = renderToStaticMarkup(
      <AppNav
        homeHref="/educador"
        subtitle="Educador"
        userName="Prof. Ana"
        items={[{ href: "/educador", label: "Turmas", icon: "users" }]}
        signOutAction={async () => {}}
      />,
    );
    expect(sidebarHtml).toContain("Prof. Ana");
    expect(sidebarHtml).toContain("Turmas");
    expect(sidebarHtml).not.toContain('aria-label="Dock de navegação"');
    expect(sidebarHtml).not.toContain('aria-label="Opções da conta"');

    const dockHtml = renderToStaticMarkup(
      <AppNav
        homeHref="/app"
        subtitle="Estudante"
        userName="João Silva"
        variant="dock"
        items={[{ href: "/app", label: "Início", icon: "home", exact: true }]}
        signOutAction={async () => {}}
      />,
    );
    expect(dockHtml).toContain('aria-label="Dock de navegação"');
    expect(dockHtml).toContain("bg-white/10");
  });

  it("PERF-17: adds AbortController cancellation and unmount cleanup to AdminUsersClient and AdminInstitutionsClient", () => {
    for (const file of [
      "src/components/admin/AdminUsersClient.tsx",
      "src/components/admin/AdminInstitutionsClient.tsx",
    ]) {
      const source = readRepoFile(file);
      expect(source).toContain("abortRef = useRef<AbortController | null>(null)");
      expect(source).toContain("abortRef.current?.abort()");
      expect(source).toContain("signal: controller.signal");
      expect(source).toContain("AbortError");
      expect(source).toContain("if (abortRef.current === controller)");
    }
  });
});
