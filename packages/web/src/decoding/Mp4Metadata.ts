import type { ISOFile, Movie } from "mp4box";

/**
 * Parsed structure of an MP4 file: its boxes, with the media data skipped.
 */
export interface Mp4Metadata {
  /** Parser holding the movie and movie fragment boxes. */
  readonly file: ISOFile;
  /** Summary of the movie header. */
  readonly movie: Movie;
}
