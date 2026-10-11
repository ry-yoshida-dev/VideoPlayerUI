/**
 * Unit of the coordinates in an annotation document.
 */
export enum CoordinateSpace {
  /** `[0, 1]` relative to the frame. */
  NORMALIZED = "normalized",
  /** Pixels of the document's `frameSize`, normalized on load. */
  PIXEL = "pixel",
}
