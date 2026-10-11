/**
 * Frame currently on screen.
 */
export interface PresentedFrame {
  /** Time id of the frame. */
  readonly timeId: number;
  /** Zero-based index of the stored frame. */
  readonly mediaIndex: number;
  /** Presentation timestamp of the frame in seconds. */
  readonly presentationSeconds: number;
}
