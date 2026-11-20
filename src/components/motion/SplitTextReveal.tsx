"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { gsap, MOTION_EASE, useGSAP } from "@/lib/gsap";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

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

      let cancelled = false;
      let splitInstance: SplitText | null = null;
      let tween: gsap.core.Tween | null = null;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const initSplit = () => {
          if (cancelled || !el || !target) return;

          splitInstance = SplitText.create(target, {
            type: "words",
            aria: "none",
          });

          tween = gsap.from(splitInstance.words, {
            y: 14,
            opacity: 0,
            duration: 0.65,
            ease: MOTION_EASE.emphasis,
            stagger: 0.045,
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          });
        };

        if (typeof document !== "undefined" && document.fonts?.ready) {
          void document.fonts.ready.then(initSplit);
        } else {
          initSplit();
        }

        return () => {
          cancelled = true;
          tween?.kill();
          splitInstance?.revert();
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
