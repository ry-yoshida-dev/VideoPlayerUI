import type { ReactNode } from "react";

/**
 * Props of {@link IconButton}.
 */
export interface IconButtonProps {
  /** Accessible name, also shown as the tooltip on hover. */
  readonly label: string;
  /** Glyph inside the button. */
  readonly children: ReactNode;
  readonly onClick: () => void;
  /** Toggle state; omit for plain buttons. */
  readonly isPressed?: boolean;
  /** Larger button for the main action. */
  readonly isPrimary?: boolean;
  /** Hidden first when the player is narrow. */
  readonly isOptional?: boolean;
}
