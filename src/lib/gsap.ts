"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

export const MOTION_EASE = {
  enter: "power2.out",
  emphasis: "power3.out",
} as const;

export const MOTION_DURATION = {
  fast: 0.3,
  base: 0.45,
  slow: 0.65,
} as const;

export const MOTION_STAGGER = 0.07;

export { gsap, ScrollTrigger, SplitText, useGSAP };
