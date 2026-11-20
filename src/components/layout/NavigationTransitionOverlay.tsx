"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const SHOW_DELAY_MS = 120;
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

  // Ignora links na mesma rota (incluindo filtros via ?query e saltos de #hash)
  if (destination.pathname === current.pathname) {
    return false;
  }

  return true;
}

export function NavigationTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname ?? ""}?${searchParams?.toString() ?? ""}`;

  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const prevRouteKeyRef = useRef(routeKey);

  function clearTimers() {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }

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
        setVisible(true);

        safetyTimerRef.current = window.setTimeout(() => {
          safetyTimerRef.current = null;
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

  useEffect(() => {
    if (prevRouteKeyRef.current === routeKey) return;
    prevRouteKeyRef.current = routeKey;
    clearTimers();
    setVisible(false);
  }, [routeKey]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-[var(--brand-primary-soft)]/80"
    >
      <div className="animate-nav-progress h-full w-1/2 rounded-full bg-[var(--brand-primary)]" />
      <span className="sr-only">Carregando próxima página...</span>
    </div>
  );
}
