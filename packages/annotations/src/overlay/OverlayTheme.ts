import type { ColorPalette } from "./ColorPalette.js";
import type { LabelTheme } from "./LabelTheme.js";

/**
 * Appearance of the overlay.
 */
export interface OverlayTheme {
  /** Colors assigned to annotations without their own color. */
  readonly palette: ColorPalette;
  /** Outline width in view units. */
  readonly lineWidth: number;
  /** Outline width of highlighted annotations in view units. */
  readonly highlightLineWidth: number;
  /** Opacity of region fills in `[0, 1]`. */
  readonly fillOpacity: number;
  /** Opacity of highlighted region fills in `[0, 1]`. */
  readonly highlightFillOpacity: number;
  /** Opacity of annotations held from an earlier frame, in `[0, 1]`. */
  readonly heldOpacity: number;
  /** Keypoint radius in view units. */
  readonly keypointRadius: number;
  /** Keypoints scoring below this are hidden. */
  readonly keypointScoreThreshold: number;
  /** Appearance of annotation tags. */
  readonly label: LabelTheme;
}
