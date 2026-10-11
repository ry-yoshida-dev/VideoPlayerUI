import type { ViewportTransform } from "@video-player-ui/core";
import type { DrawingSurface } from "@video-player-ui/core";
import type { OverlayHit } from "./OverlayHit.js";
import type { OverlayLayer } from "./OverlayLayer.js";

/**
 * Inputs of one overlay redraw.
 */
export interface OverlayRenderRequest {
  /** Surface to draw on. */
  readonly surface: DrawingSurface;
  /** Mapping from normalized frame coordinates to the surface. */
  readonly transform: ViewportTransform;
  /** Time id of the frame on screen, or null to only clear the surface. */
  readonly timeId: number | null;
  /** Layers drawn bottom to top. */
  readonly layers: readonly OverlayLayer[];
  /** Whether an annotation is drawn highlighted. */
  readonly isHighlighted?: (hit: OverlayHit) => boolean;
}
