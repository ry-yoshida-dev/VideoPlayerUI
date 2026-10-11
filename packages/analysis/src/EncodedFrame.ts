/**
 * One frame encoded as an image file, ready to send to an analyzer.
 */
export interface EncodedFrame {
  /** Encoded image bytes. */
  readonly bytes: ArrayBuffer;
  /** Encoding of the bytes, such as `image/png`. */
  readonly mimeType: string;
  /** Frame width in pixels. */
  readonly width: number;
  /** Frame height in pixels. */
  readonly height: number;
}
