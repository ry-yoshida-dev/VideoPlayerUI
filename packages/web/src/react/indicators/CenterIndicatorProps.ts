import type { PlayerSnapshot } from "@video-player-ui/core";

import type { Feedback } from "./Feedback.js";

/**
 * Props of {@link CenterIndicator}.
 */
export interface CenterIndicatorProps {
  /** Player state, or null before the player exists. */
  readonly snapshot: PlayerSnapshot | null;
  /** Brief glyph to show, or null. */
  readonly feedback: Feedback | null;
  /** Called when the brief glyph has faded out. */
  readonly onFeedbackEnd: () => void;
}
