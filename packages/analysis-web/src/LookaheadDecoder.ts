import type { DecodedFrame } from "@video-player-ui/web";

/**
 * Source of decoded frames a {@link DecodingLookahead} runs ahead with, such
 * as `SequentialFrameDecoder`.
 */
export interface LookaheadDecoder {
  /**
   * Decode from a stored frame onwards.
   *
   * @param presentationIndex - First stored frame to yield.
   * @returns Frames in presentation order; the receiver closes each one, and
   *   stopping the iteration releases the decoder.
   */
  decodeFrom(presentationIndex: number): AsyncIterable<DecodedFrame>;
}
