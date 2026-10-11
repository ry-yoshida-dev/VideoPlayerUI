import type { Point } from "@video-player-ui/core";

/**
 * One landmark of a {@link KeypointsAnnotation}.
 */
export interface Keypoint extends Point {
  /** Confidence or visibility in `[0, 1]`. */
  readonly score?: number;
}
