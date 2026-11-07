import type { SeekTargetKind } from "./SeekTargetKind.js";

/**
 * Parsed seek position typed by the user.
 */
export interface SeekTarget {
  readonly kind: SeekTargetKind;
  /** Time id, or seconds from the start of the media. */
  readonly value: number;
}
