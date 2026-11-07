/**
 * Imperative access to a {@link FrameCanvas}.
 */
export interface FrameCanvasHandle {
  /** Draw again for the frame on screen, as after the drawn data changed. */
  readonly redraw: () => void;
}
