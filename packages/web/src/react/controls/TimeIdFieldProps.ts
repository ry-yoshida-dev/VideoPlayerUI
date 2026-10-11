import type { Ref } from "react";
import type { PlayerController, PlayerSnapshot } from "@video-player-ui/core";

/**
 * Props of {@link TimeIdField}.
 */
export interface TimeIdFieldProps {
  readonly controller: PlayerController;
  readonly snapshot: PlayerSnapshot;
  /** Accessible name and tooltip. */
  readonly label: string;
  /** Receives the input element, as for a shortcut that focuses it. */
  readonly inputRef?: Ref<HTMLInputElement>;
  /** Called after a jump or on Escape, to hand keyboard focus back to the player. */
  readonly onFinish: () => void;
}
