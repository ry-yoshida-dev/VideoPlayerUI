/**
 * Which annotations a frame without its own annotations shows.
 */
export enum AnnotationLookupPolicy {
  /** Only the frame's own annotations; frames between annotated ones show nothing. */
  EXACT = "exact",
  /** The nearest annotated frame at or before it, so sparse annotations do not flicker. */
  HOLD_PREVIOUS = "hold-previous",
}
