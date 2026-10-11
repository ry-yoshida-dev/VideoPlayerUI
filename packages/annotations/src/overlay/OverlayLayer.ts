import type { Annotation } from "../annotation/AnnotationTypeMap.js";
import type { AnnotationSource } from "../source/AnnotationSource.js";
import type { OverlayTheme } from "./OverlayTheme.js";

/**
 * One stack of annotations drawn over the video, such as ground truth or a
 * model's predictions.
 */
export interface OverlayLayer {
  /** Identifier unique among the layers of a player. */
  readonly id: string;
  /** Where the layer's annotations come from. */
  readonly source: AnnotationSource;
  /** Whether the layer is drawn. Defaults to true. */
  readonly isVisible?: boolean;
  /** Opacity of the whole layer in `[0, 1]`. Defaults to 1. */
  readonly opacity?: number;
  /** Keeps only the annotations for which it returns true, as a score threshold. */
  readonly filter?: (annotation: Annotation) => boolean;
  /** Theme values overriding the player's theme for this layer. */
  readonly theme?: Partial<OverlayTheme>;
}
