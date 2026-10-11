/**
 * Texts of the analysis status and its tooltip; replace them to translate.
 */
export interface LiveAnalysisLabels {
  /** First line of the tooltip. */
  readonly status: string;
  /** The frame on screen shows its own result. */
  readonly inSync: string;
  /** The frame on screen shows the result of an earlier frame. */
  readonly behind: (frames: number, shownTimeId: number) => string;
  /** No result has arrived yet. */
  readonly waiting: string;
  /** Time from sending a frame to receiving its result. */
  readonly roundTrip: (milliseconds: number) => string;
  /** Frames sent and not answered yet. */
  readonly inFlight: (count: number) => string;
  /** Frames with a result. */
  readonly analyzedFrames: (count: number) => string;
  /** Shown in the status in place of the round trip until the first result arrives. */
  readonly pending: string;
  /** Shown in the status after a failed request; the tooltip carries the details. */
  readonly failed: string;
}
