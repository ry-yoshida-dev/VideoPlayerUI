import type { Annotation } from "./AnnotationTypeMap.js";

/**
 * Parsed annotation document, with coordinates normalized.
 */
export interface AnnotationDocument {
  /** Annotations of each annotated time id. */
  readonly frames: ReadonlyMap<number, readonly Annotation[]>;
}
