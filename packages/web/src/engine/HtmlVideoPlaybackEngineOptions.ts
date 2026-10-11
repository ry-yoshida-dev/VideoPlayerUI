import type { FrameTableResolver } from "../frame-table/FrameTableResolver.js";
import type { VideoSource } from "../source/VideoSource.js";

/**
 * Inputs of an {@link HtmlVideoPlaybackEngine}.
 */
export interface HtmlVideoPlaybackEngineOptions {
  /** Element that decodes and displays the video; the engine owns its source while loaded. */
  readonly video: HTMLVideoElement;
  /** URL or in-memory file to play. */
  readonly source: VideoSource;
  /** How frame timestamps are found. */
  readonly frameTableResolver: FrameTableResolver;
}
