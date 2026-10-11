import type { Annotation } from "../annotation/AnnotationTypeMap.js";

/**
 * Annotation under a point, with the layer it belongs to.
 */
export interface OverlayHit {
  readonly layerId: string;
  readonly annotation: Annotation;
}
