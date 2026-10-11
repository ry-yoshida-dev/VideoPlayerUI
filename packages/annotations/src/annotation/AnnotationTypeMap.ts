import type { AnnotationKind } from "./AnnotationKind.js";
import type { BoundingBoxAnnotation } from "./BoundingBoxAnnotation.js";
import type { KeypointsAnnotation } from "./KeypointsAnnotation.js";
import type { PolygonAnnotation } from "./PolygonAnnotation.js";

/**
 * Annotation type of every kind, keyed by kind tag.
 *
 * Applications add custom kinds through declaration merging:
 *
 * ```ts
 * declare module "@video-player-ui/core" {
 *   interface AnnotationTypeMap {
 *     heatmap: HeatmapAnnotation;
 *   }
 * }
 * ```
 */
export interface AnnotationTypeMap {
  [AnnotationKind.BOUNDING_BOX]: BoundingBoxAnnotation;
  [AnnotationKind.POLYGON]: PolygonAnnotation;
  [AnnotationKind.KEYPOINTS]: KeypointsAnnotation;
}

/**
 * Kind tag of any registered annotation type.
 */
export type AnnotationKindName = keyof AnnotationTypeMap & string;

/**
 * Any annotation of a registered kind.
 */
export type Annotation = AnnotationTypeMap[AnnotationKindName];
