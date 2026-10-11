import type { AnalysisScheduler } from "@video-player-ui/analysis";
import type { PlayerController } from "@video-player-ui/core";
import type { FrameCaptureOptions } from "@video-player-ui/web";

import type { LookaheadDecoder } from "./LookaheadDecoder.js";

/**
 * Inputs of a {@link DecodingLookahead}.
 */
export interface DecodingLookaheadOptions {
  /** Decoder of the video the player shows. */
  readonly decoder: LookaheadDecoder;
  /** Player whose playhead the look-ahead runs ahead of. */
  readonly controller: PlayerController;
  /** Scheduler receiving the decoded frames. */
  readonly scheduler: AnalysisScheduler;
  /** How far ahead of the playhead to analyze, in seconds; 0 analyzes only the frame on screen. */
  readonly leadSeconds: number;
  /** Encoding of the frames sent. */
  readonly capture: FrameCaptureOptions;
  /** Called when decoding fails, before the look-ahead retries. */
  readonly onError?: (error: Error) => void;
}
