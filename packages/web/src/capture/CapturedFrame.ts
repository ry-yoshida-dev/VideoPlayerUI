/**
 * Encoded frame together with the time id it shows.
 */
export interface CapturedFrame {
  /** Time id of the captured frame. */
  readonly timeId: number;
  /** Encoded image. */
  readonly blob: Blob;
  /** Frame width in pixels. */
  readonly width: number;
  /** Frame height in pixels. */
  readonly height: number;
}
