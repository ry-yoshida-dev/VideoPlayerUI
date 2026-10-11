import type { ViewportTransform } from "@video-player-ui/core";
import type { DrawingSurface } from "@video-player-ui/core";
import type { LabelPainter } from "./LabelPainter.js";
import type { OverlayTheme } from "./OverlayTheme.js";

/**
 * Everything a plugin needs to draw one annotation.
 */
export interface RenderContext {
  /** Surface to draw on. */
  readonly surface: DrawingSurface;
  /** Mapping from normalized frame coordinates to the surface. */
  readonly transform: ViewportTransform;
  /** Theme of the layer being drawn. */
  readonly theme: OverlayTheme;
  /** Color resolved for the annotation. */
  readonly color: string;
  /** Whether the annotation is highlighted, as under the pointer or selected. */
  readonly isHighlighted: boolean;
  /** Shared painter for annotation tags. */
  readonly labelPainter: LabelPainter;
}
