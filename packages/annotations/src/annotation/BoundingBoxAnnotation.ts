import type { Rect } from "@video-player-ui/core";
import type { AnnotationBase } from "./AnnotationBase.js";
import type { AnnotationKind } from "./AnnotationKind.js";

/**
 * Axis-aligned box around an object.
 */
export interface BoundingBoxAnnotation extends AnnotationBase<AnnotationKind.BOUNDING_BOX> {
  /** Box in normalized frame coordinates. */
  readonly box: Rect;
}
