import type { AnnotationLookupPolicy } from "./AnnotationLookupPolicy.js";

/**
 * How a source resolves time ids to annotations.
 */
export interface AnnotationLookupOptions {
  /** Policy for frames without their own annotations. Defaults to {@link AnnotationLookupPolicy.HOLD_PREVIOUS}. */
  readonly policy?: AnnotationLookupPolicy;
  /** Longest gap in time ids a held annotation spans. Defaults to no limit. */
  readonly maxHoldTimeIds?: number;
}
