/**
 * One video sample of an MP4 file, with its place in decode and presentation order.
 */
export interface Mp4Sample {
  /** Position in decode order, starting at 0. */
  readonly decodeIndex: number;
  /** Stored frame index in presentation order, or null for samples the edit list hides. */
  readonly presentationIndex: number | null;
  /** Presentation time after the edit list, in microseconds; negative for hidden samples. */
  readonly timestampMicroseconds: number;
  /** Display duration in microseconds. */
  readonly durationMicroseconds: number;
  /** Whether decoding can start at this sample. */
  readonly isKeyFrame: boolean;
  /** Byte offset of the sample data in the file. */
  readonly offset: number;
  /** Byte length of the sample data. */
  readonly size: number;
}
