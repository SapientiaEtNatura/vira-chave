"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface SlidingIndicatorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  ready: boolean;
}

export function useSlidingIndicator<T extends string>(activeKey: T) {
  const containerElRef = useRef<HTMLElement | null>(null);
  const containerRef = useCallback((el: HTMLElement | null) => {
    containerElRef.current = el;
  }, []);
  const itemRefs = useRef<Partial<Record<T, HTMLElement | null>>>({});
  const refCallbacks = useRef<
    Partial<Record<T, (el: HTMLElement | null) => void>>
  >({});

  const [indicator, setIndicator] = useState<SlidingIndicatorRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const setItemRef = useCallback((key: T) => {
    let cb = refCallbacks.current[key];
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        itemRefs.current[key] = el;
      };
      refCallbacks.current[key] = cb;
    }
    return cb;
  }, []);

  const updateIndicator = useCallback(() => {
    const activeEl = itemRefs.current[activeKey];
    if (!activeEl) {
      setIndicator((prev) => (prev.ready ? { ...prev, ready: false } : prev));
      return;
    }

    const x = activeEl.offsetLeft;
    const y = activeEl.offsetTop;
    const width = activeEl.offsetWidth;
    const height = activeEl.offsetHeight;

    setIndicator((prev) => {
      if (
        prev.ready &&
        prev.x === x &&
        prev.y === y &&
        prev.width === width &&
        prev.height === height
      ) {
        return prev;
      }
      return { x, y, width, height, ready: true };
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const containerEl = containerElRef.current;
    const activeEl = itemRefs.current[activeKey];
    if (!containerEl && !activeEl) return;

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateIndicator())
        : null;

    if (containerEl) observer?.observe(containerEl);
    if (activeEl && activeEl !== containerEl) observer?.observe(activeEl);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeKey, updateIndicator]);

  return {
    containerRef,
    setItemRef,
    indicator,
  };
}
