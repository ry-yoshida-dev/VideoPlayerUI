import type { Ref } from "react";
import type { PlayerController, PlayerSnapshot } from "@video-player-ui/core";

import type { FullscreenState } from "../FullscreenState.js";
import type { PlayerLabels } from "../PlayerLabels.js";
import type { TimeFormatter } from "../TimeFormatter.js";
import type { CopyNotice } from "./CopyNotice.js";

/**
 * Props of {@link PlayerControls}.
 */
export interface PlayerControlsProps {
  readonly controller: PlayerController;
  readonly snapshot: PlayerSnapshot;
  readonly labels: PlayerLabels;
  readonly formatter: TimeFormatter;
  /** Speeds offered in the speed menu. */
  readonly playbackRates: readonly number[];
  readonly skipBackwardSeconds: number;
  readonly skipForwardSeconds: number;
  /** Whether the editable time id field is shown. */
  readonly isTimeIdVisible: boolean;
  /** Receives the time id input, for the shortcut that focuses it. */
  readonly timeIdInputRef: Ref<HTMLInputElement>;
  /** Hands keyboard focus back to the player after editing the time id. */
  readonly onTimeIdFinish: () => void;
  /** Copies the frame on screen to the clipboard. */
  readonly onCopyFrame: () => void;
  /** Confirmation of the last copy, or null. */
  readonly copyNotice: CopyNotice | null;
  /** Called when the copy confirmation has faded out. */
  readonly onCopyNoticeEnd: () => void;
  /** Receives the element extensions render their controls into. */
  readonly slotRef: (element: HTMLSpanElement | null) => void;
  readonly fullscreen: FullscreenState;
}
