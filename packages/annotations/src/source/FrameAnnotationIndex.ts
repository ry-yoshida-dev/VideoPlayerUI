import type { Annotation } from "../annotation/AnnotationTypeMap.js";
import type { AnnotationLookupOptions } from "./AnnotationLookupOptions.js";
import { AnnotationLookupPolicy } from "./AnnotationLookupPolicy.js";

/**
 * Annotations by time id, kept sorted for lookups that hold earlier frames.
 */
export class FrameAnnotationIndex {
  private static readonly EMPTY: readonly Annotation[] = [];

  private readonly frames: Map<number, readonly Annotation[]> = new Map();
  private readonly sortedTimeIds: number[] = [];
  private readonly policy: AnnotationLookupPolicy;
  private readonly maxHoldTimeIds: number;

  /**
   * Create an empty index.
   *
   * @param options - Lookup policy and hold limit.
   * @throws RangeError When the hold limit is negative.
   */
  constructor(options: AnnotationLookupOptions = {}) {
    this.policy = options.policy ?? AnnotationLookupPolicy.HOLD_PREVIOUS;
    this.maxHoldTimeIds = options.maxHoldTimeIds ?? Number.POSITIVE_INFINITY;
    if (!(this.maxHoldTimeIds >= 0)) {
      throw new RangeError(`maxHoldTimeIds must not be negative, given: ${this.maxHoldTimeIds}`);
    }
  }

  /**
   * Number of annotated time ids.
   */
  get size(): number {
    return this.sortedTimeIds.length;
  }

  /**
   * Set the annotations of a time id, replacing earlier ones.
   *
   * @param timeId - Time id the annotations belong to.
   * @param annotations - Annotations of the frame.
   */
  set(timeId: number, annotations: readonly Annotation[]): void {
    if (!this.frames.has(timeId)) {
      this.sortedTimeIds.splice(this.insertionIndexOf(timeId), 0, timeId);
    }
    this.frames.set(timeId, annotations);
  }

  /**
   * Remove every time id before a bound, as to cap memory in live streams.
   *
   * @param timeId - First time id to keep.
   */
  deleteBefore(timeId: number): void {
    const removedCount: number = this.insertionIndexOf(timeId);
    for (const removed of this.sortedTimeIds.splice(0, removedCount)) {
      this.frames.delete(removed);
    }
  }

  /**
   * Remove every time id.
   */
  clear(): void {
    this.frames.clear();
    this.sortedTimeIds.length = 0;
  }

  /**
   * Annotations to show on a time id under the lookup policy.
   *
   * @param timeId - Time id of the frame on screen.
   * @returns The annotations, empty when there are none.
   */
  lookup(timeId: number): readonly Annotation[] {
    const sourceTimeId: number | null = this.sourceTimeIdOf(timeId);
    return sourceTimeId === null ? FrameAnnotationIndex.EMPTY : (this.frames.get(sourceTimeId) ?? FrameAnnotationIndex.EMPTY);
  }

  /**
   * Time id whose annotations {@link FrameAnnotationIndex.lookup} returns.
   *
   * @param timeId - Time id of the frame on screen.
   * @returns The time id itself, an earlier held one, or null when nothing is shown.
   */
  sourceTimeIdOf(timeId: number): number | null {
    if (this.frames.has(timeId)) {
      return timeId;
    }
    switch (this.policy) {
      case AnnotationLookupPolicy.EXACT:
        return null;
      case AnnotationLookupPolicy.HOLD_PREVIOUS: {
        const previousTimeId: number | undefined = this.sortedTimeIds[this.insertionIndexOf(timeId) - 1];
        if (previousTimeId === undefined || timeId - previousTimeId > this.maxHoldTimeIds) {
          return null;
        }
        return previousTimeId;
      }
    }
  }

  private insertionIndexOf(timeId: number): number {
    let low: number = 0;
    let high: number = this.sortedTimeIds.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      const value: number | undefined = this.sortedTimeIds[middle];
      if (value !== undefined && value < timeId) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low;
  }
}
