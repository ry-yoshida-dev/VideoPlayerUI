import { TimelineParameters } from "./TimelineParameters.js";
import type { TimelineParametersInit } from "./TimelineParametersInit.js";

/**
 * Mapping between stored media frames and time ids, following
 * `spec/timeline.md`.
 */
export class Timeline {
  /** Sampling parameters the timeline was built with. */
  readonly parameters: TimelineParameters;
  /** Number of stored frames in the media. */
  readonly frameCount: number;
  /** Time id of the last stored frame. */
  readonly mediaLastTimeId: number;
  /** First time id playback, seeking and stepping may reach. */
  readonly rangeStartTimeId: number;
  /** Last time id playback, seeking and stepping may reach. */
  readonly rangeEndTimeId: number;

  /**
   * Build the timeline of a media source.
   *
   * @param parameters - Sampling parameters, validated when given as init values.
   * @param frameCount - Number of stored frames; at least 1.
   * @throws RangeError When `frameCount` is not a positive integer.
   */
  constructor(parameters: TimelineParameters | TimelineParametersInit, frameCount: number) {
    if (!Number.isInteger(frameCount) || frameCount < 1) {
      throw new RangeError(`frameCount must be a positive integer, given: ${frameCount}`);
    }
    this.parameters = parameters instanceof TimelineParameters ? parameters : new TimelineParameters(parameters);
    this.frameCount = frameCount;
    this.mediaLastTimeId = this.timeIdOf(frameCount - 1);
    this.rangeStartTimeId = this.parameters.startTimeId;
    this.rangeEndTimeId =
      this.parameters.endTimeId === null ? this.mediaLastTimeId : Math.min(this.parameters.endTimeId, this.mediaLastTimeId);
  }

  /**
   * Time ids between two consecutive sampled steps.
   */
  get step(): number {
    return this.parameters.step;
  }

  /**
   * Whether the range holds no stored frame, as when `startTimeId` lies past
   * the media.
   */
  get isEmpty(): boolean {
    return this.rangeStartTimeId > this.rangeEndTimeId;
  }

  /**
   * Number of sampled time ids in the range.
   */
  get sampledStepCount(): number {
    if (this.isEmpty) {
      return 0;
    }
    return Math.floor((this.rangeEndTimeId - this.rangeStartTimeId) / this.step) + 1;
  }

  /**
   * Time id of a stored frame.
   *
   * @param mediaIndex - Zero-based index of the stored frame.
   * @returns The frame's time id.
   * @throws RangeError When the index addresses no stored frame.
   */
  timeIdOf(mediaIndex: number): number {
    if (!Number.isInteger(mediaIndex) || mediaIndex < 0 || mediaIndex >= this.frameCount) {
      throw new RangeError(`mediaIndex must be an integer between 0 and ${this.frameCount - 1}, given: ${mediaIndex}`);
    }
    return this.parameters.indexBase + mediaIndex * this.parameters.preSampledFrequency;
  }

  /**
   * Stored frame a time id addresses, as `TimeSeriesIterator.media_index_of`.
   *
   * @param timeId - Time id on the pre-sampled grid.
   * @returns Zero-based index of the stored frame.
   * @throws RangeError When the id lies outside the media or off the grid.
   */
  mediaIndexOf(timeId: number): number {
    const offset: number = timeId - this.parameters.indexBase;
    if (!Number.isInteger(timeId) || offset < 0 || timeId > this.mediaLastTimeId) {
      throw new RangeError(`timeId must be an integer between ${this.parameters.indexBase} and ${this.mediaLastTimeId}, given: ${timeId}`);
    }
    if (offset % this.parameters.preSampledFrequency !== 0) {
      throw new RangeError(
        `timeId must fall on the pre-sampled grid: (timeId - ${this.parameters.indexBase}) must be a multiple of preSampledFrequency (${this.parameters.preSampledFrequency}), given: ${timeId}`,
      );
    }
    return offset / this.parameters.preSampledFrequency;
  }

  /**
   * Whether a time id lies on the sampled grid inside the range.
   *
   * @param timeId - Time id to check.
   * @returns True when stepping can land on the id.
   */
  isSampledTimeId(timeId: number): boolean {
    return (
      Number.isInteger(timeId) &&
      timeId >= this.rangeStartTimeId &&
      timeId <= this.rangeEndTimeId &&
      (timeId - this.rangeStartTimeId) % this.step === 0
    );
  }

  /**
   * Iterate the sampled time ids of the range in order.
   *
   * @returns The ids TimeSeriesIterator yields for the same parameters.
   */
  *sampledTimeIds(): Generator<number, void, undefined> {
    for (let timeId = this.rangeStartTimeId; timeId <= this.rangeEndTimeId; timeId += this.step) {
      yield timeId;
    }
  }

  /**
   * First sampled time id after a time id.
   *
   * @param timeId - Reference time id, on the grid or not.
   * @returns The next sampled id, or null when none remains in the range.
   */
  nextSampledTimeId(timeId: number): number | null {
    if (this.isEmpty) {
      return null;
    }
    if (timeId < this.rangeStartTimeId) {
      return this.rangeStartTimeId;
    }
    const stepIndex: number = Math.floor((timeId - this.rangeStartTimeId) / this.step) + 1;
    const candidate: number = this.rangeStartTimeId + stepIndex * this.step;
    return candidate <= this.rangeEndTimeId ? candidate : null;
  }

  /**
   * Last sampled time id before a time id.
   *
   * @param timeId - Reference time id, on the grid or not.
   * @returns The previous sampled id, or null when none precedes it in the range.
   */
  previousSampledTimeId(timeId: number): number | null {
    if (this.isEmpty || timeId <= this.rangeStartTimeId) {
      return null;
    }
    const lastSampled: number = this.rangeStartTimeId + (this.sampledStepCount - 1) * this.step;
    if (timeId > lastSampled) {
      return lastSampled;
    }
    const stepIndex: number = Math.ceil((timeId - this.rangeStartTimeId) / this.step) - 1;
    return this.rangeStartTimeId + stepIndex * this.step;
  }

  /**
   * Nearest stored frame's time id at or before a time id, kept inside the range.
   *
   * @param timeId - Any time id.
   * @returns A time id on the pre-sampled grid within the range.
   * @throws RangeError When the range is empty.
   */
  clampToRange(timeId: number): number {
    if (this.isEmpty) {
      throw new RangeError(`The range is empty: startTimeId ${this.rangeStartTimeId} lies past the last time id ${this.rangeEndTimeId}`);
    }
    const bounded: number = Math.min(Math.max(timeId, this.rangeStartTimeId), this.rangeEndTimeId);
    const pre: number = this.parameters.preSampledFrequency;
    const gridOffset: number = Math.floor((bounded - this.parameters.indexBase) / pre) * pre;
    return this.parameters.indexBase + gridOffset;
  }
}
