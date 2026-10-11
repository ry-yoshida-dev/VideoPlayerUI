import type { VideoSource } from "../source/VideoSource.js";

/**
 * What a {@link FrameTableResolver} knows about the video it resolves.
 */
export interface FrameTableRequest {
  /** The video's source. */
  readonly source: VideoSource;
  /** Duration the browser reported after reading the metadata, in seconds. */
  readonly durationSeconds: number;
}
