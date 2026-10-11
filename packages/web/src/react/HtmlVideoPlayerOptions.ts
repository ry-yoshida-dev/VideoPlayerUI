import type { TimelineParametersInit } from "@video-player-ui/core";

import type { FrameTableResolver } from "../frame-table/FrameTableResolver.js";
import type { CrossOrigin } from "../source/CrossOrigin.js";
import type { VideoSource } from "../source/VideoSource.js";

/**
 * Inputs of {@link useHtmlVideoPlayer}.
 */
export interface HtmlVideoPlayerOptions {
  /** URL or in-memory file to play. */
  readonly source: VideoSource;
  /**
   * How a URL on another origin is requested. Defaults to {@link CrossOrigin.NONE},
   * which plays any URL; frame copy, analysis and the exact frame table of a
   * cross-origin URL need {@link CrossOrigin.ANONYMOUS} or
   * {@link CrossOrigin.USE_CREDENTIALS} and CORS headers on its server.
   */
  readonly crossOrigin?: CrossOrigin;
  /** Sampling parameters of the timeline, as TimeSeriesIterator's. */
  readonly timeline?: TimelineParametersInit;
  /** Frame rate assumed when the container's sample table cannot be read. */
  readonly framesPerSecond?: number;
  /** Replaces the default resolver chain (MP4 sample table, then `framesPerSecond`). */
  readonly frameTableResolver?: FrameTableResolver;
  /** Start playing once loaded; browsers may require `isMuted` for this. */
  readonly isAutoPlay?: boolean;
  /** Initial speed multiplier. */
  readonly playbackRate?: number;
  /** Initial mute state. */
  readonly isMuted?: boolean;
  /** Initial loop state. */
  readonly isLooping?: boolean;
}
