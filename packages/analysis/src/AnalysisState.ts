/**
 * Activity of live analysis.
 */
export enum AnalysisState {
  /** Waiting for a frame that has not been analyzed yet. */
  IDLE = "idle",
  /** A frame is with the analyzer. */
  ANALYZING = "analyzing",
  /** The last request failed; see the status error. */
  FAILED = "failed",
}
