/**
 * Frame produced by {@link SequentialFrameDecoder}; the receiver must close `frame`.
 */
export interface DecodedFrame {
  /** Stored frame index of the frame. */
  readonly presentationIndex: number;
  /** Decoded pixels; call `close()` once done. */
  readonly frame: VideoFrame;
}
