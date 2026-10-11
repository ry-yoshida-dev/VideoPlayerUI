import type { DrawingSurface, PresentedFrame, ViewportTransform } from "@video-player-ui/core";

/**
 * Inputs of one {@link FrameCanvas} redraw.
 */
export interface FrameDrawContext {
  /** Cleared surface in view coordinates. */
  readonly surface: DrawingSurface;
  /** Mapping from normalized frame coordinates to the surface. */
  readonly transform: ViewportTransform;
  /** Frame on screen. */
  readonly frame: PresentedFrame;
}
