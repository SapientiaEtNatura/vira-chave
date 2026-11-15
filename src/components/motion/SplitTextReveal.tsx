"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import {
  gsap,
  MOTION_DURATION,
  MOTION_EASE,
  SplitText,
  useGSAP,
} from "@/lib/gsap";

interface SplitTextRevealProps {
  text: string;
  as?: "h2" | "h3" | "p";
  id?: string;
  className?: string;
  children?: ReactNode;
}

export function SplitTextReveal({
  text,
  as: Tag = "h2",
  id,
  className,
  children,
}: SplitTextRevealProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = headingRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el, {
          type: "words",
          aria: "hidden",
        });

        gsap.from(split.words, {
          y: 14,
          opacity: 0,
          duration: MOTION_DURATION.base,
          ease: MOTION_EASE.emphasis,
          stagger: 0.045,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        });

        return () => {
          split.revert();
        };
      });
    },
    { scope: headingRef },
  );

  return (
    <Tag ref={headingRef} id={id} aria-label={text} className={className}>
      {children ?? text}
    </Tag>
  );
}
