import { useContext } from "react";

import { PlayerContext } from "./PlayerContext.js";
import type { PlayerContextValue } from "./PlayerContextValue.js";

/**
 * Services of the enclosing {@link VideoPlayer}.
 *
 * @returns The controller, fit, control slot, feedback and shortcut registry.
 * @throws Error When called outside a {@link VideoPlayer}'s children.
 */
export function usePlayerContext(): PlayerContextValue {
  const value: PlayerContextValue | null = useContext(PlayerContext);
  if (value === null) {
    throw new Error("usePlayerContext must be called inside the children of a VideoPlayer");
  }
  return value;
}
