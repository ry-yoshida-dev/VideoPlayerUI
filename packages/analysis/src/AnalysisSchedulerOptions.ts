import type { StreamingAnnotationSource } from "@video-player-ui/annotations";

import type { FrameAnalyzer } from "./FrameAnalyzer.js";

/**
 * Inputs of an {@link AnalysisScheduler}.
 */
export interface AnalysisSchedulerOptions {
  /** Analyzer the frames go to. */
  readonly analyzer: FrameAnalyzer;
  /** Receives the results, keyed by the time id of the analyzed frame. */
  readonly source: StreamingAnnotationSource;
  /** Requests sent before earlier ones return; raises throughput when the server works in parallel. Defaults to 1. */
  readonly maxInFlight?: number;
  /** Pause after a failure before sending again, in milliseconds. Defaults to 1000. */
  readonly retryDelayMilliseconds?: number;
  /** Clock in milliseconds. Defaults to `performance.now`. */
  readonly now?: () => number;
}
