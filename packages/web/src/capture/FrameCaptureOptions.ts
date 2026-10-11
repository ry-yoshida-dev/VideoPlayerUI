import type { ImageEncoding } from "./ImageEncoding.js";

/**
 * How {@link FrameCapture} encodes a frame.
 */
export interface FrameCaptureOptions {
  /** Image format. Defaults to {@link ImageEncoding.PNG}. */
  readonly encoding?: ImageEncoding;
  /** Quality in `[0, 1]` for lossy formats. Defaults to the browser's choice. */
  readonly quality?: number;
}
