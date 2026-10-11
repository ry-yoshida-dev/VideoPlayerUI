import { useEffect, useRef } from "react";

import type { PlayerContextValue } from "./PlayerContextValue.js";
import { usePlayerContext } from "./usePlayerContext.js";

/**
 * Bind a key of the enclosing {@link VideoPlayer} to a command while the component is mounted.
 *
 * @param key - `KeyboardEvent.key`, letters in lower case, or null to bind nothing.
 * @param handler - Command to run; the latest one is always used.
 */
export function usePlayerShortcut(key: string | null, handler: () => void): void {
  const { registerShortcut }: PlayerContextValue = usePlayerContext();
  const handlerRef: { current: () => void } = useRef<() => void>(handler);
  handlerRef.current = handler;
  useEffect(() => {
    if (key === null) {
      return undefined;
    }
    return registerShortcut(key, () => handlerRef.current());
  }, [key, registerShortcut]);
}
