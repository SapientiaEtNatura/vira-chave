import { describe, expect, it } from "vitest";
import {
  shouldTriggerNavigationOverlay,
  type NavigationTriggerCheck,
} from "@/components/layout/NavigationTransitionOverlay";

function makeCheck(
  overrides: Partial<NavigationTriggerCheck> = {},
): NavigationTriggerCheck {
  return {
    href: "/app/descobrir",
    target: null,
    hasDownload: false,
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    currentUrl: "http://localhost:3000/app",
    ...overrides,
  };
}

describe("shouldTriggerNavigationOverlay", () => {
  it("returns true for standard internal route and query navigations", () => {
    expect(shouldTriggerNavigationOverlay(makeCheck())).toBe(true);
    expect(
      shouldTriggerNavigationOverlay(
        makeCheck({
          href: "/app/aprender?area=tecnologia-dados",
          currentUrl: "http://localhost:3000/app/aprender",
        }),
      ),
    ).toBe(true);
  });

  it("ignores same-route links and hash-only jumps", () => {
    expect(
      shouldTriggerNavigationOverlay(
        makeCheck({
          href: "/app",
          currentUrl: "http://localhost:3000/app",
        }),
      ),
    ).toBe(false);

    expect(
      shouldTriggerNavigationOverlay(
        makeCheck({
          href: "#etapas",
          currentUrl: "http://localhost:3000/",
        }),
      ),
    ).toBe(false);

    expect(
      shouldTriggerNavigationOverlay(
        makeCheck({
          href: "/app#topo",
          currentUrl: "http://localhost:3000/app",
        }),
      ),
    ).toBe(false);
  });

  it("ignores external links, special schemes, new-tab targets, and downloads", () => {
    expect(
      shouldTriggerNavigationOverlay(
        makeCheck({ href: "https://example.com/curso" }),
      ),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ href: "mailto:oi@escola.br" })),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ target: "_blank" })),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ hasDownload: true })),
    ).toBe(false);
  });

  it("ignores modified clicks, non-primary buttons, and prevented events", () => {
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ ctrlKey: true })),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ metaKey: true })),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ shiftKey: true })),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ button: 1 })),
    ).toBe(false);
    expect(
      shouldTriggerNavigationOverlay(makeCheck({ defaultPrevented: true })),
    ).toBe(false);
  });
});
