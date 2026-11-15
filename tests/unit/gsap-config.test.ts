import { describe, expect, it } from "vitest";
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from "@/lib/gsap";

describe("gsap-config", () => {
  it("exports motion tokens safely in Node/SSR environment", () => {
    expect(MOTION_EASE.enter).toBe("power2.out");
    expect(MOTION_EASE.emphasis).toBe("power3.out");
    expect(MOTION_DURATION).toEqual({ fast: 0.3, base: 0.45, slow: 0.65 });
    expect(MOTION_STAGGER).toBe(0.07);
  });
});
