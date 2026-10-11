/**
 * Consecutive bytes of a source and their position in it.
 */
export interface ByteChunk {
  readonly bytes: ArrayBuffer;
  /** Offset of the first byte within the source. */
  readonly offset: number;
}
