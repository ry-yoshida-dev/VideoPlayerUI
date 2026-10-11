import type { DecodedFrame } from "@video-player-ui/web";

import type { LookaheadDecoder } from "../../src/index.js";

/**
 * Frame handed out by {@link FakeLookaheadDecoder}, recording whether it was released.
 */
export class FakeDecodedVideoFrame {
  readonly displayWidth: number = 4;
  readonly displayHeight: number = 3;
  isClosed: boolean = false;

  close(): void {
    this.isClosed = true;
  }
}

/**
 * Decoder yielding placeholder frames for a fixed number of stored frames.
 */
export class FakeLookaheadDecoder implements LookaheadDecoder {
  readonly startIndices: number[] = [];
  readonly frames: FakeDecodedVideoFrame[] = [];
  private readonly frameCount: number;

  constructor(frameCount: number) {
    this.frameCount = frameCount;
  }

  async *decodeFrom(presentationIndex: number): AsyncGenerator<DecodedFrame, void, undefined> {
    this.startIndices.push(presentationIndex);
    for (let index = presentationIndex; index < this.frameCount; index += 1) {
      const frame: FakeDecodedVideoFrame = new FakeDecodedVideoFrame();
      this.frames.push(frame);
      await Promise.resolve();
      yield { presentationIndex: index, frame: frame as unknown as VideoFrame };
    }
  }
}
