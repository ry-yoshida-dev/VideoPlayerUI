import type { AnalysisState } from "./AnalysisState.js";

/**
 * Immutable view of live analysis; a new object is published on every change.
 */
export interface AnalysisStatus {
  readonly state: AnalysisState;
  /** Time id of the frame sent most recently, or null. */
  readonly inFlightTimeId: number | null;
  /** Number of requests waiting for their results. */
  readonly inFlightCount: number;
  /** Time id of the latest frame whose results arrived, or null. */
  readonly lastAnalyzedTimeId: number | null;
  /** Round trip of the latest successful request in milliseconds, or null. */
  readonly lastLatencyMilliseconds: number | null;
  /** Number of frames analyzed since the last reset. */
  readonly analyzedFrameCount: number;
  /** Failure of the last request, or null. */
  readonly error: Error | null;
}
