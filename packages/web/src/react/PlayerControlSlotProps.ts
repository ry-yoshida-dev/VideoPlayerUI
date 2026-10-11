import type { ReactNode } from "react";

/**
 * Props of {@link PlayerControlSlot}.
 */
export interface PlayerControlSlotProps {
  /** Controls to place in the control bar, typically {@link IconButton}s. */
  readonly children: ReactNode;
}
