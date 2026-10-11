import type { CrossOrigin } from "../source/CrossOrigin.js";
import type { VideoSource } from "../source/VideoSource.js";

/**
 * What a {@link FrameTableResolver} knows about the video it resolves.
 */
export interface FrameTableRequest {
  /** The video's source. */
  readonly source: VideoSource;
  /** How the video element requests the source; resolvers reading a URL send the same credentials. */
  readonly crossOrigin: CrossOrigin;
  /** Duration the browser reported after reading the metadata, in seconds. */
  readonly durationSeconds: number;
}
