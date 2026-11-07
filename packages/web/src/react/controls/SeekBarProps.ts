import type { PlayerController, PlayerSnapshot } from "@video-player-ui/core";

import type { TimeFormatter } from "../../time-notation/TimeFormatter.js";

/**
 * Props of {@link SeekBar}.
 */
export interface SeekBarProps {
  readonly controller: PlayerController;
  readonly snapshot: PlayerSnapshot;
  readonly formatter: TimeFormatter;
  /** Accessible name of the slider. */
  readonly label: string;
}
