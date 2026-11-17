"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import {
  gsap,
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
  const splitTargetRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = headingRef.current;
      const target = splitTargetRef.current;
      if (!el || !target) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(target, {
          type: "words",
          aria: "none",
        });

        gsap.from(split.words, {
          y: 16,
          opacity: 0,
          duration: 0.7,
          ease: MOTION_EASE.emphasis,
          stagger: 0.055,
          scrollTrigger: {
            trigger: el,
            start: "top 62%",
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
    <Tag ref={headingRef} id={id} className={className}>
      <span className="sr-only">{text}</span>
      <span ref={splitTargetRef} aria-hidden="true">
        {children ?? text}
      </span>
    </Tag>
  );
}
