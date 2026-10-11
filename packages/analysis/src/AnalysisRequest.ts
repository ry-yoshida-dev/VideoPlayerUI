import type { EncodedFrame } from "./EncodedFrame.js";

/**
 * A frame to analyze, with the time id the results belong to.
 */
export interface AnalysisRequest {
  readonly timeId: number;
  readonly frame: EncodedFrame;
}
