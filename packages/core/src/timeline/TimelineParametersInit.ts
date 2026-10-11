import type { IndexBase } from "./IndexBase.js";

/**
 * Optional inputs of {@link TimelineParameters}; omitted fields take the
 * defaults of TimeSeriesIterator.
 */
export interface TimelineParametersInit {
  /** Time id of the first raw frame. Defaults to {@link IndexBase.ONE}. */
  readonly indexBase?: IndexBase;
  /** Raw frames per stored frame. Defaults to 1. */
  readonly preSampledFrequency?: number;
  /** Stored frames per sampled step. Defaults to 1. */
  readonly samplingFrequency?: number;
  /** First time id of the range. Defaults to `indexBase`. */
  readonly startTimeId?: number;
  /** Last time id of the range, or null to run to the last frame. Defaults to null. */
  readonly endTimeId?: number | null;
}
