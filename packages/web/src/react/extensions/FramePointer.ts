import type { Point, PresentedFrame, ViewportTransform } from "@video-player-ui/core";

/**
 * Pointer position over a {@link FrameCanvas}.
 */
export interface FramePointer {
  /** Position in view coordinates. */
  readonly viewPoint: Point;
  /** Position in normalized frame coordinates; outside `[0, 1]` off the frame. */
  readonly framePoint: Point;
  /** Mapping between the two. */
  readonly transform: ViewportTransform;
  /** Frame on screen. */
  readonly frame: PresentedFrame;
}
