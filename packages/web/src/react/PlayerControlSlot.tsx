import { createPortal } from "react-dom";
import type { ReactPortal } from "react";

import type { PlayerContextValue } from "./PlayerContextValue.js";
import type { PlayerControlSlotProps } from "./PlayerControlSlotProps.js";
import { usePlayerContext } from "./usePlayerContext.js";

/**
 * Places an extension's controls in the player's control bar, before the full screen button.
 *
 * @param props - The controls.
 * @returns A portal into the control bar, or null while the bar is not shown.
 */
export function PlayerControlSlot({ children }: PlayerControlSlotProps): ReactPortal | null {
  const { controlSlot }: PlayerContextValue = usePlayerContext();
  return controlSlot === null ? null : createPortal(children, controlSlot);
}
