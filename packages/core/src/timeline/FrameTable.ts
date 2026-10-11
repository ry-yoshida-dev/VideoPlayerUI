/**
 * Presentation timestamps of the stored frames of a media source.
 *
 * Resolves a platform clock to the frame on screen and picks the seek target
 * that lands on a given frame, as described in `spec/timeline.md`.
 */
export class FrameTable {
  /** Slack absorbing rounding in platform clocks, in seconds. */
  static readonly CLOCK_TOLERANCE_SECONDS: number = 0.001;

  private readonly timestamps: Float64Array;
  /** End of the last frame's display interval, in seconds. */
  readonly endSeconds: number;

  private constructor(timestamps: Float64Array, endSeconds: number) {
    this.timestamps = timestamps;
    this.endSeconds = endSeconds;
  }

  /**
   * Build the table from the timestamps of a container's sample table.
   *
   * @param timestamps - Presentation timestamps in seconds, strictly increasing.
   * @param endSeconds - End of the last frame's display interval, after its timestamp.
   * @returns The frame table.
   * @throws RangeError When the timestamps are empty, unordered or not finite.
   */
  static fromTimestamps(timestamps: readonly number[], endSeconds: number): FrameTable {
    if (timestamps.length === 0) {
      throw new RangeError("timestamps must hold at least one frame");
    }
    const values: Float64Array = Float64Array.from(timestamps);
    for (let index = 0; index < values.length; index += 1) {
      const current: number = FrameTable.at(values, index);
      if (!Number.isFinite(current)) {
        throw new RangeError(`timestamps[${index}] must be finite, given: ${current}`);
      }
      if (index > 0 && current <= FrameTable.at(values, index - 1)) {
        throw new RangeError(`timestamps must be strictly increasing, broken at index ${index}`);
      }
    }
    const lastTimestamp: number = FrameTable.at(values, values.length - 1);
    if (!Number.isFinite(endSeconds) || endSeconds <= lastTimestamp) {
      throw new RangeError(`endSeconds must be finite and after the last timestamp (${lastTimestamp}), given: ${endSeconds}`);
    }
    return new FrameTable(values, endSeconds);
  }

  /**
   * Build the table of a constant frame rate source starting at zero.
   *
   * @param frameCount - Number of stored frames; at least 1.
   * @param framesPerSecond - Frame rate; positive.
   * @returns The frame table.
   * @throws RangeError When an argument is out of range.
   */
  static fromConstantFrameRate(frameCount: number, framesPerSecond: number): FrameTable {
    if (!Number.isInteger(frameCount) || frameCount < 1) {
      throw new RangeError(`frameCount must be a positive integer, given: ${frameCount}`);
    }
    if (!Number.isFinite(framesPerSecond) || framesPerSecond <= 0) {
      throw new RangeError(`framesPerSecond must be positive, given: ${framesPerSecond}`);
    }
    const timestamps: Float64Array = new Float64Array(frameCount);
    for (let index = 0; index < frameCount; index += 1) {
      timestamps[index] = index / framesPerSecond;
    }
    return new FrameTable(timestamps, frameCount / framesPerSecond);
  }

  /**
   * Number of stored frames.
   */
  get frameCount(): number {
    return this.timestamps.length;
  }

  /**
   * Presentation timestamp of a stored frame.
   *
   * @param mediaIndex - Zero-based index of the frame.
   * @returns The timestamp in seconds.
   * @throws RangeError When the index addresses no frame.
   */
  timestampOf(mediaIndex: number): number {
    this.requireIndex(mediaIndex);
    return FrameTable.at(this.timestamps, mediaIndex);
  }

  /**
   * Stored frame on screen at a presentation time.
   *
   * @param seconds - Presentation time reported by the platform clock.
   * @returns The last frame starting at or before the time, or 0 before the first frame.
   */
  indexAt(seconds: number): number {
    const target: number = seconds + FrameTable.CLOCK_TOLERANCE_SECONDS;
    let low: number = 0;
    let high: number = this.timestamps.length - 1;
    if (target < FrameTable.at(this.timestamps, 0)) {
      return 0;
    }
    while (low < high) {
      const middle: number = Math.ceil((low + high) / 2);
      if (FrameTable.at(this.timestamps, middle) <= target) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    return low;
  }

  /**
   * Seek position that displays a stored frame: the middle of its display interval.
   *
   * @param mediaIndex - Zero-based index of the frame.
   * @returns The seek position in seconds.
   * @throws RangeError When the index addresses no frame.
   */
  seekTargetOf(mediaIndex: number): number {
    this.requireIndex(mediaIndex);
    const start: number = FrameTable.at(this.timestamps, mediaIndex);
    const end: number = mediaIndex + 1 < this.timestamps.length ? FrameTable.at(this.timestamps, mediaIndex + 1) : this.endSeconds;
    return (start + end) / 2;
  }

  private requireIndex(mediaIndex: number): void {
    if (!Number.isInteger(mediaIndex) || mediaIndex < 0 || mediaIndex >= this.timestamps.length) {
      throw new RangeError(`mediaIndex must be an integer between 0 and ${this.timestamps.length - 1}, given: ${mediaIndex}`);
    }
  }

  private static at(values: Float64Array, index: number): number {
    const value: number | undefined = values[index];
    if (value === undefined) {
      throw new RangeError(`index ${index} is outside the table of ${values.length} frames`);
    }
    return value;
  }
}
