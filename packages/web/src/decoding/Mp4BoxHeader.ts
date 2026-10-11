/**
 * Header of a top-level MP4 box.
 */
export interface Mp4BoxHeader {
  /** Whether the box holds media data, which parsing the structure never needs. */
  readonly isMediaData: boolean;
  /** Size of the header itself, in bytes. */
  readonly headerBytes: number;
  /** Size of the whole box in bytes, or null when it extends to the end of the file. */
  readonly boxBytes: number | null;
}
