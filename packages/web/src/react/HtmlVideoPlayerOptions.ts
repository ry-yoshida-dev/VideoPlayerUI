import type { TimelineParametersInit } from "@video-player-ui/core";

import type { FrameTableResolver } from "../frame-table/FrameTableResolver.js";
import type { VideoSource } from "../source/VideoSource.js";

/**
 * Inputs of {@link useHtmlVideoPlayer}.
 */
export interface HtmlVideoPlayerOptions {
  /** URL or in-memory file to play. */
  readonly source: VideoSource;
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
