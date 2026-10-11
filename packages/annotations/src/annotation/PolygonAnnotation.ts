import type { Point } from "@video-player-ui/core";
import type { AnnotationBase } from "./AnnotationBase.js";
import type { AnnotationKind } from "./AnnotationKind.js";

/**
 * Outline of a region, or an open polyline.
 */
export interface PolygonAnnotation extends AnnotationBase<AnnotationKind.POLYGON> {
  /** Vertices in normalized frame coordinates; at least three. */
  readonly points: readonly Point[];
  /** Whether the last vertex connects back to the first. */
  readonly isClosed: boolean;
}
