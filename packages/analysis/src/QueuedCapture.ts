import type { FrameCapturer } from "./FrameCapturer.js";

/**
 * Frame waiting for a free slot of the scheduler.
 */
export interface QueuedCapture {
  readonly timeId: number;
  readonly capture: FrameCapturer;
}
