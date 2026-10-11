import type { ByteRangeReader } from "../source/ByteRangeReader.js";
import type { DecodedFrame } from "./DecodedFrame.js";
import type { Mp4Sample } from "./Mp4Sample.js";
import type { Mp4SampleTable } from "./Mp4SampleTable.js";

/**
 * Decodes an MP4 video track with WebCodecs, frame by frame in presentation
 * order, from any stored frame onwards.
 *
 * Each frame carries the stored frame index derived from its own sample
 * timestamp, so the pixels and the index always belong together.
 */
export class SequentialFrameDecoder {
  /** Encoded chunks kept queued in the decoder. */
  static readonly MAX_QUEUED_CHUNKS: number = 8;
  /** Decoded frames kept before the receiver takes them. */
  static readonly MAX_PENDING_FRAMES: number = 3;
  /** Samples read from the source in one request. */
  static readonly READ_BATCH_SAMPLES: number = 12;

  private readonly table: Mp4SampleTable;
  private readonly reader: ByteRangeReader;
  private readonly presentationIndexByTimestamp: ReadonlyMap<number, number>;

  /**
   * Bind the decoder to a sample table and the bytes it describes.
   *
   * @param table - Sample table of the video track.
   * @param reader - Reader of the same file.
   */
  constructor(table: Mp4SampleTable, reader: ByteRangeReader) {
    this.table = table;
    this.reader = reader;
    this.presentationIndexByTimestamp = new Map(
      table.samplesInPresentationOrder.map((sample: Mp4Sample, index: number) => [sample.timestampMicroseconds, index]),
    );
  }

  /**
   * Whether the browser offers WebCodecs video decoding.
   *
   * @returns True when `VideoDecoder` exists.
   */
  static isSupported(): boolean {
    return typeof VideoDecoder !== "undefined";
  }

  /**
   * Number of stored frames.
   */
  get frameCount(): number {
    return this.table.samplesInPresentationOrder.length;
  }

  /**
   * Decode from a stored frame to the end of the track.
   *
   * Decoding starts at the key frame before the requested frame and pauses
   * while the receiver holds back; stopping the iteration releases the decoder.
   *
   * @param presentationIndex - First stored frame to yield.
   * @returns Frames in presentation order; the receiver closes each one.
   * @throws RangeError When the index addresses no stored frame.
   * @throws DOMException When the browser cannot decode the track.
   */
  async *decodeFrom(presentationIndex: number): AsyncGenerator<DecodedFrame, void, undefined> {
    const target: Mp4Sample | undefined = this.table.samplesInPresentationOrder[presentationIndex];
    if (target === undefined) {
      throw new RangeError(`presentationIndex must be between 0 and ${this.frameCount - 1}, given: ${presentationIndex}`);
    }
    const samples: readonly Mp4Sample[] = this.table.samplesInDecodeOrder;
    let cursor: number = this.keyFrameBefore(target.decodeIndex);
    const pending: VideoFrame[] = [];
    const signal: { failure: Error | null; wake: (() => void) | null; isFlushed: boolean } = {
      failure: null,
      wake: null,
      isFlushed: false,
    };
    const notify: () => void = (): void => {
      const wake: (() => void) | null = signal.wake;
      signal.wake = null;
      wake?.();
    };
    const decoder: VideoDecoder = new VideoDecoder({
      output: (frame: VideoFrame): void => {
        pending.push(frame);
        notify();
      },
      error: (error: DOMException): void => {
        signal.failure = error;
        notify();
      },
    });
    decoder.addEventListener("dequeue", notify);
    decoder.configure(this.table.decoderConfig);
    let flushing: Promise<void> | null = null;
    try {
      while (true) {
        if (signal.failure !== null) {
          throw signal.failure;
        }
        const frame: VideoFrame | undefined = pending.shift();
        if (frame !== undefined) {
          const index: number | undefined = this.presentationIndexByTimestamp.get(frame.timestamp);
          if (index === undefined || index < presentationIndex) {
            frame.close();
            continue;
          }
          yield { presentationIndex: index, frame };
          continue;
        }
        if (
          cursor < samples.length &&
          decoder.decodeQueueSize < SequentialFrameDecoder.MAX_QUEUED_CHUNKS &&
          pending.length < SequentialFrameDecoder.MAX_PENDING_FRAMES
        ) {
          cursor = await this.feed(decoder, cursor);
          continue;
        }
        if (cursor >= samples.length && flushing === null) {
          flushing = decoder.flush().then(
            () => {
              signal.isFlushed = true;
              notify();
            },
            (error: unknown) => {
              signal.failure = error instanceof Error ? error : new Error(String(error));
              notify();
            },
          );
        }
        if (signal.isFlushed && pending.length === 0) {
          return;
        }
        await new Promise<void>((resolve: () => void) => {
          signal.wake = resolve;
        });
      }
    } finally {
      for (const frame of pending) {
        frame.close();
      }
      if (decoder.state !== "closed") {
        decoder.close();
      }
    }
  }

  private async feed(decoder: VideoDecoder, cursor: number): Promise<number> {
    const batch: readonly Mp4Sample[] = this.table.samplesInDecodeOrder.slice(cursor, cursor + SequentialFrameDecoder.READ_BATCH_SAMPLES);
    const start: number = Math.min(...batch.map((sample: Mp4Sample) => sample.offset));
    const end: number = Math.max(...batch.map((sample: Mp4Sample) => sample.offset + sample.size));
    const bytes: Uint8Array<ArrayBuffer> = await this.reader.read(start, end - start);
    if (decoder.state === "closed") {
      return cursor + batch.length;
    }
    for (const sample of batch) {
      decoder.decode(
        new EncodedVideoChunk({
          type: sample.isKeyFrame ? "key" : "delta",
          timestamp: sample.timestampMicroseconds,
          duration: sample.durationMicroseconds,
          data: bytes.subarray(sample.offset - start, sample.offset - start + sample.size),
        }),
      );
    }
    return cursor + batch.length;
  }

  private keyFrameBefore(decodeIndex: number): number {
    for (let index = decodeIndex; index >= 0; index -= 1) {
      if (this.table.samplesInDecodeOrder[index]?.isKeyFrame === true) {
        return index;
      }
    }
    return 0;
  }
}
