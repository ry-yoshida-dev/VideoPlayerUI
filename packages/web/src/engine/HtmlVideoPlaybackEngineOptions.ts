import type { FrameTableResolver } from "../frame-table/FrameTableResolver.js";
import type { CrossOrigin } from "../source/CrossOrigin.js";
import type { VideoSource } from "../source/VideoSource.js";

/**
 * Inputs of an {@link HtmlVideoPlaybackEngine}.
 */
export interface HtmlVideoPlaybackEngineOptions {
  /** Element that decodes and displays the video; the engine owns its source while loaded. */
  readonly video: HTMLVideoElement;
  /** URL or in-memory file to play. */
  readonly source: VideoSource;
  /** How a URL on another origin is requested; frames can be read back only with CORS. */
  readonly crossOrigin: CrossOrigin;
  /** How frame timestamps are found. */
  readonly frameTableResolver: FrameTableResolver;
}
