import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

import type { FullscreenState } from "./FullscreenState.js";

/**
 * Full screen state of an element.
 *
 * @param elementRef - Element to show full screen.
 * @returns Support, state and toggle.
 */
export function useFullscreen(elementRef: RefObject<HTMLElement | null>): FullscreenState {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const isSupported: boolean = typeof document !== "undefined" && document.fullscreenEnabled;

  useEffect(() => {
    const onChange: () => void = (): void => setIsFullscreen(document.fullscreenElement === elementRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [elementRef]);

  const toggle: () => void = useCallback((): void => {
    const element: HTMLElement | null = elementRef.current;
    if (element === null || !document.fullscreenEnabled) {
      return;
    }
    if (document.fullscreenElement === element) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen();
    }
  }, [elementRef]);

  return { isSupported, isFullscreen, toggle };
}
