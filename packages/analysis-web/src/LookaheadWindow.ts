/**
 * Stored frames the look-ahead should have analyzed.
 */
export interface LookaheadWindow {
  /** Stored frame index on screen. */
  readonly playheadIndex: number;
  /** First stored frame whose result can still arrive before it is shown. */
  readonly firstUsefulIndex: number;
  /** Last stored frame index to analyze ahead. */
  readonly endIndex: number;
}
