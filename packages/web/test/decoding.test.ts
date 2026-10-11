import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { beforeEach, describe, it } from "node:test";

import type { FrameTable } from "@video-player-ui/core";

import { ByteRangeReader, FrameTableResolutionError, Mp4SampleTable, SequentialFrameDecoder } from "../src/index.js";
import type { DecodedFrame, Mp4Sample } from "../src/index.js";
import { FakeVideoDecoder, installFakeWebCodecs } from "./support/FakeWebCodecs.js";
import type { FakeVideoFrame } from "./support/FakeWebCodecs.js";

const FRAME_COUNT: number = 12;
const FRAME_MICROSECONDS: number = 100_000;
const PRESENTATION_INDICES_IN_DECODE_ORDER: readonly number[] = [0, 3, 1, 2, 5, 4, 6, 9, 7, 8, 11, 10];

async function fixture(): Promise<Blob> {
  const bytes: Buffer = await readFile(new URL("./fixtures/bframes.mp4", import.meta.url));
  return new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
}

async function collect(frames: AsyncIterable<DecodedFrame>): Promise<DecodedFrame[]> {
  const collected: DecodedFrame[] = [];
  for await (const decoded of frames) {
    collected.push(decoded);
  }
  return collected;
}

describe("Mp4SampleTable", () => {
  it("orders samples by presentation time after the edit list", async () => {
    const table: Mp4SampleTable = await Mp4SampleTable.read(await fixture());
    assert.equal(table.samplesInDecodeOrder.length, FRAME_COUNT);
    assert.deepEqual(
      table.samplesInDecodeOrder.map((sample: Mp4Sample) => sample.presentationIndex),
      PRESENTATION_INDICES_IN_DECODE_ORDER,
    );
    assert.deepEqual(
      table.samplesInPresentationOrder.map((sample: Mp4Sample) => sample.timestampMicroseconds),
      Array.from({ length: FRAME_COUNT }, (_: unknown, index: number) => index * FRAME_MICROSECONDS),
    );
    assert.deepEqual(
      table.samplesInDecodeOrder.filter((sample: Mp4Sample) => sample.isKeyFrame).map((sample: Mp4Sample) => sample.decodeIndex),
      [0, 6],
    );
    assert.equal(table.endSeconds, 1.2);
  });

  it("describes the decoder configuration of the track", async () => {
    const table: Mp4SampleTable = await Mp4SampleTable.read(await fixture());
    assert.match(table.decoderConfig.codec, /^avc1\./);
    assert.equal(table.decoderConfig.codedWidth, 64);
    assert.equal(table.decoderConfig.codedHeight, 48);
    assert.ok(table.decoderConfig.description instanceof Uint8Array);
  });

  it("builds a frame table that resolves clocks to stored frames", async () => {
    const frameTable: FrameTable = (await Mp4SampleTable.read(await fixture())).toFrameTable();
    assert.equal(frameTable.frameCount, FRAME_COUNT);
    assert.equal(frameTable.indexAt(0.35), 3);
    assert.equal(frameTable.endSeconds, 1.2);
  });

  it("rejects files that are not MP4", async () => {
    await assert.rejects(Mp4SampleTable.read(new Blob([new Uint8Array(64)])), FrameTableResolutionError);
  });
});

describe("SequentialFrameDecoder", () => {
  beforeEach(() => {
    installFakeWebCodecs();
  });

  async function createDecoder(): Promise<SequentialFrameDecoder> {
    const source: Blob = await fixture();
    return new SequentialFrameDecoder(await Mp4SampleTable.read(source), new ByteRangeReader(source));
  }

  it("yields every stored frame in presentation order", async () => {
    const decoder: SequentialFrameDecoder = await createDecoder();
    const frames: DecodedFrame[] = await collect(decoder.decodeFrom(0));
    assert.deepEqual(
      frames.map((decoded: DecodedFrame) => decoded.presentationIndex),
      Array.from({ length: FRAME_COUNT }, (_: unknown, index: number) => index),
    );
    assert.ok(frames.every((decoded: DecodedFrame) => decoded.frame.timestamp === decoded.presentationIndex * FRAME_MICROSECONDS));
    assert.equal(FakeVideoDecoder.instances[0]?.state, "closed");
  });

  it("starts at the preceding key frame and releases the frames before the target", async () => {
    const decoder: SequentialFrameDecoder = await createDecoder();
    const frames: DecodedFrame[] = await collect(decoder.decodeFrom(8));
    assert.deepEqual(
      frames.map((decoded: DecodedFrame) => decoded.presentationIndex),
      [8, 9, 10, 11],
    );
    const fake: FakeVideoDecoder | undefined = FakeVideoDecoder.instances[0];
    assert.equal(fake?.chunks.length, FRAME_COUNT - 6);
    const skipped: readonly FakeVideoFrame[] = fake.frames.filter((frame: FakeVideoFrame) => frame.timestamp < 8 * FRAME_MICROSECONDS);
    assert.equal(skipped.length, 2);
    assert.ok(skipped.every((frame: FakeVideoFrame) => frame.isClosed));
  });

  it("releases the decoder and pending frames when the receiver stops early", async () => {
    const decoder: SequentialFrameDecoder = await createDecoder();
    for await (const decoded of decoder.decodeFrom(0)) {
      decoded.frame.close();
      break;
    }
    const fake: FakeVideoDecoder | undefined = FakeVideoDecoder.instances[0];
    assert.equal(fake?.state, "closed");
    assert.ok(fake.frames.every((frame: FakeVideoFrame) => frame.isClosed));
  });

  it("rejects indices outside the track", async () => {
    const decoder: SequentialFrameDecoder = await createDecoder();
    await assert.rejects(collect(decoder.decodeFrom(FRAME_COUNT)), RangeError);
  });
});
