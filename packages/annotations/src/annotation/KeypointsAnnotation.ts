import type { AnnotationBase } from "./AnnotationBase.js";
import type { AnnotationKind } from "./AnnotationKind.js";
import type { Keypoint } from "./Keypoint.js";
import type { KeypointEdge } from "./KeypointEdge.js";

/**
 * Landmarks of one object, optionally joined into a skeleton.
 */
export interface KeypointsAnnotation extends AnnotationBase<AnnotationKind.KEYPOINTS> {
  /** Landmarks in normalized frame coordinates. */
  readonly points: readonly Keypoint[];
  /** Skeleton connections between landmarks. */
  readonly edges: readonly KeypointEdge[];
}
