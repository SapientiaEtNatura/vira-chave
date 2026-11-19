"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ViraChaveLoader } from "@/components/motion/ViraChaveLoader";
import { gsap, MOTION_EASE } from "@/lib/gsap";

export const SHOW_DELAY_MS = 120;
export const MIN_VISIBLE_MS = 450;
export const SAFETY_TIMEOUT_MS = 8000;

export interface NavigationTriggerCheck {
  href: string | null;
  target: string | null;
  hasDownload: boolean;
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  currentUrl: string;
}

export function shouldTriggerNavigationOverlay({
  href,
  target,
  hasDownload,
  defaultPrevented,
  button,
  metaKey,
  ctrlKey,
  shiftKey,
  altKey,
  currentUrl,
}: NavigationTriggerCheck): boolean {
  if (
    defaultPrevented ||
    button !== 0 ||
    metaKey ||
    ctrlKey ||
    shiftKey ||
    altKey ||
    hasDownload
  ) {
    return false;
  }

  if (!href) return false;
  if (target && target !== "_self") return false;

  const trimmedHref = href.trim();
  if (
    !trimmedHref ||
    trimmedHref.startsWith("#") ||
    trimmedHref.startsWith("mailto:") ||
    trimmedHref.startsWith("tel:") ||
    trimmedHref.startsWith("javascript:")
  ) {
    return false;
  }

  let current: URL;
  let destination: URL;
  try {
    current = new URL(currentUrl);
    destination = new URL(trimmedHref, current);
  } catch {
    return false;
  }

  if (destination.origin !== current.origin) {
    return false;
  }

  // Ignora links que apontam para a mesma rota + query (ex.: só troca de #hash ou clique na aba atual)
  if (
    destination.pathname === current.pathname &&
    destination.search === current.search
  ) {
    return false;
  }

  return true;
}

export function NavigationTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname ?? ""}?${searchParams?.toString() ?? ""}`;

  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const shownAtRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const prevRouteKeyRef = useRef(routeKey);

  function clearTimers() {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }

  // Anima entrada suave do blur quando visível
  useEffect(() => {
    if (!visible) return;
    const el = overlayRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      gsap.set(el, { opacity: 1 });
      return;
    }

    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.22, ease: MOTION_EASE.enter },
    );
  }, [visible]);

  // Escuta cliques em links internos no documento
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const targetNode = event.target;
      if (!(targetNode instanceof Element)) return;

      const anchor = targetNode.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const shouldTrigger = shouldTriggerNavigationOverlay({
        href: anchor.getAttribute("href"),
        target: anchor.getAttribute("target"),
        hasDownload: anchor.hasAttribute("download"),
        defaultPrevented: event.defaultPrevented,
        button: event.button,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        currentUrl: window.location.href,
      });

      if (!shouldTrigger) return;

      clearTimers();

      showTimerRef.current = window.setTimeout(() => {
        showTimerRef.current = null;
        shownAtRef.current = Date.now();
        setVisible(true);

        safetyTimerRef.current = window.setTimeout(() => {
          safetyTimerRef.current = null;
          shownAtRef.current = null;
          setVisible(false);
        }, SAFETY_TIMEOUT_MS);
      }, SHOW_DELAY_MS);
    }

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      clearTimers();
    };
  }, []);

  // Encerra o overlay suavemente quando a nova rota termina de montar
  useEffect(() => {
    if (prevRouteKeyRef.current === routeKey) return;
    prevRouteKeyRef.current = routeKey;

    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    if (shownAtRef.current === null) return;

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      const el = overlayRef.current;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (!el || prefersReduced) {
        shownAtRef.current = null;
        setVisible(false);
        return;
      }

      gsap.to(el, {
        opacity: 0,
        duration: 0.24,
        ease: MOTION_EASE.enter,
        onComplete: () => {
          shownAtRef.current = null;
          setVisible(false);
        },
      });
    }, remaining);
  }, [routeKey]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      aria-busy="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas)]/65 backdrop-blur-md"
    >
      <ViraChaveLoader size={92} label="Carregando próxima tela..." />
    </div>
  );
}
