import { IndexBase } from "./IndexBase.js";
import type { TimelineParametersInit } from "./TimelineParametersInit.js";

/**
 * Validated sampling parameters of a timeline.
 *
 * Mirrors `TimeSeriesIterationParameters` of TimeSeriesIterator, with an
 * unbounded end written as null instead of -1.
 */
export class TimelineParameters {
  /** Time id of the first raw frame. */
  readonly indexBase: IndexBase;
  /** Raw frames per stored frame. */
  readonly preSampledFrequency: number;
  /** Stored frames per sampled step. */
  readonly samplingFrequency: number;
  /** First time id of the range. */
  readonly startTimeId: number;
  /** Last time id of the range, or null to run to the last frame. */
  readonly endTimeId: number | null;

  /**
   * Validate and store the parameters.
   *
   * @param init - Parameters to validate; omitted fields take their defaults.
   * @throws RangeError When a value breaks the TimeSeriesIterator rules.
   */
  constructor(init: TimelineParametersInit = {}) {
    this.indexBase = init.indexBase ?? IndexBase.ONE;
    this.preSampledFrequency = init.preSampledFrequency ?? 1;
    this.samplingFrequency = init.samplingFrequency ?? 1;
    this.startTimeId = init.startTimeId ?? this.indexBase;
    this.endTimeId = init.endTimeId ?? null;
    this.validate();
  }

  /**
   * Time ids between two consecutive sampled steps.
   */
  get step(): number {
    return this.samplingFrequency * this.preSampledFrequency;
  }

  private validate(): void {
    TimelineParameters.requirePositiveInteger("preSampledFrequency", this.preSampledFrequency);
    TimelineParameters.requirePositiveInteger("samplingFrequency", this.samplingFrequency);
    if (!Number.isInteger(this.startTimeId)) {
      throw new RangeError(`startTimeId must be an integer, given: ${this.startTimeId}`);
    }
    const firstTimeId: number = this.indexBase;
    if (this.startTimeId < firstTimeId) {
      throw new RangeError(`startTimeId must be greater than or equal to the index base (${this.indexBase}), given: ${this.startTimeId}`);
    }
    if ((this.startTimeId - this.indexBase) % this.preSampledFrequency !== 0) {
      throw new RangeError(
        `startTimeId must fall on the pre-sampled grid: (startTimeId - ${this.indexBase}) must be a multiple of preSampledFrequency (${this.preSampledFrequency}), given: ${this.startTimeId}`,
      );
    }
    if (this.endTimeId === null) {
      return;
    }
    if (!Number.isInteger(this.endTimeId) || this.endTimeId <= 0) {
      throw new RangeError(`endTimeId must be null or a positive integer, given: ${this.endTimeId}`);
    }
    if (this.endTimeId < this.startTimeId) {
      throw new RangeError(
        `endTimeId must be null or greater than or equal to startTimeId (${this.startTimeId}), given: ${this.endTimeId}`,
      );
    }
  }

  private static requirePositiveInteger(name: string, value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(`${name} must be a positive integer, given: ${value}`);
    }
  }
}
