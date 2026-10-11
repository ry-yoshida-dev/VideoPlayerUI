import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { FrameTable } from "@video-player-ui/core";

import {
  ByteRangeReader,
  CrossOrigin,
  FrameTableResolutionError,
  Mp4MetadataReader,
  Mp4SampleTable,
  SequentialFrameDecoder,
} from "../src/index.js";
import type { DecodedFrame, Mp4Sample } from "../src/index.js";
import { FakeRangeServer } from "./support/FakeRangeServer.js";
import { FakeVideoDecoder, installFakeWebCodecs } from "./support/FakeWebCodecs.js";
import type { FakeVideoFrame } from "./support/FakeWebCodecs.js";

const FRAME_COUNT: number = 12;
const FRAME_MICROSECONDS: number = 100_000;
const PRESENTATION_INDICES_IN_DECODE_ORDER: readonly number[] = [0, 3, 1, 2, 5, 4, 6, 9, 7, 8, 11, 10];
const VIDEO_URL: string = "https://videos.example/clip.mp4";

async function fixtureBytes(name: string = "bframes.mp4"): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
}

async function fixture(name: string = "bframes.mp4"): Promise<Blob> {
  return new Blob([await fixtureBytes(name)], { type: "video/mp4" });
}

async function readTable(source: Blob | string): Promise<Mp4SampleTable> {
  return await Mp4SampleTable.read(new ByteRangeReader(source));
}

function timestampsOf(table: Mp4SampleTable): number[] {
  return table.samplesInPresentationOrder.map((sample: Mp4Sample) => sample.timestampMicroseconds);
}

function withPaddedMediaData(bytes: Uint8Array<ArrayBuffer>, paddingBytes: number): Uint8Array<ArrayBuffer> {
  const view: DataView = new DataView(bytes.buffer);
  for (let offset = 0; offset < bytes.length; offset += view.getUint32(offset)) {
    if (String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)) !== "mdat") {
      continue;
    }
    const end: number = offset + view.getUint32(offset);
    const padded: Uint8Array<ArrayBuffer> = new Uint8Array(bytes.length + paddingBytes);
    padded.set(bytes.subarray(0, end));
    padded.set(bytes.subarray(end), end + paddingBytes);
    new DataView(padded.buffer).setUint32(offset, end - offset + paddingBytes);
    return padded;
  }
  throw new RangeError("The file has no mdat box");
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
    const table: Mp4SampleTable = await readTable(await fixture());
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
    const table: Mp4SampleTable = await readTable(await fixture());
    assert.match(table.decoderConfig.codec, /^avc1\./);
    assert.equal(table.decoderConfig.codedWidth, 64);
    assert.equal(table.decoderConfig.codedHeight, 48);
    assert.ok(table.decoderConfig.description instanceof Uint8Array);
  });

  it("builds a frame table that resolves clocks to stored frames", async () => {
    const frameTable: FrameTable = (await readTable(await fixture())).toFrameTable();
    assert.equal(frameTable.frameCount, FRAME_COUNT);
    assert.equal(frameTable.indexAt(0.35), 3);
    assert.equal(frameTable.endSeconds, 1.2);
  });

  it("rejects files that are not MP4", async () => {
    await assert.rejects(readTable(new Blob([new Uint8Array(64)])), FrameTableResolutionError);
    const webmHeader: Uint8Array<ArrayBuffer> = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81]);
    await assert.rejects(readTable(new Blob([webmHeader])), FrameTableResolutionError);
  });

  it("reads a movie header placed after the media data", async () => {
    const table: Mp4SampleTable = await readTable(await fixture("moov-at-end.mp4"));
    assert.deepEqual(timestampsOf(table), timestampsOf(await readTable(await fixture())));
    assert.equal(table.endSeconds, 1.2);
  });

  it("skips the media data of a URL instead of downloading it", async () => {
    const paddingBytes: number = 4 * 1024 * 1024;
    const server: FakeRangeServer = new FakeRangeServer(withPaddedMediaData(await fixtureBytes("moov-at-end.mp4"), paddingBytes));
    server.install();
    try {
      const table: Mp4SampleTable = await readTable(VIDEO_URL);
      assert.equal(table.samplesInPresentationOrder.length, FRAME_COUNT);
      assert.ok(server.servedBytes < 2 * Mp4MetadataReader.READ_AHEAD_BYTES, `served ${server.servedBytes} bytes`);
    } finally {
      server.uninstall();
    }
  });

  it("collects the samples of every fragment of a fragmented file", async () => {
    const fragmented: Blob = await fixture("fragmented.mp4");
    const table: Mp4SampleTable = await readTable(fragmented);
    const reference: Mp4SampleTable = await readTable(await fixture());
    assert.deepEqual(
      table.samplesInDecodeOrder.map((sample: Mp4Sample) => sample.presentationIndex),
      PRESENTATION_INDICES_IN_DECODE_ORDER,
    );
    const firstTimestamp: number = table.samplesInPresentationOrder[0]?.timestampMicroseconds ?? Number.NaN;
    assert.deepEqual(
      timestampsOf(table),
      Array.from({ length: FRAME_COUNT }, (_: unknown, index: number) => firstTimestamp + index * FRAME_MICROSECONDS),
    );
    const fragmentedReader: ByteRangeReader = new ByteRangeReader(fragmented);
    const referenceReader: ByteRangeReader = new ByteRangeReader(await fixture());
    for (const [index, sample] of table.samplesInDecodeOrder.entries()) {
      const expected: Mp4Sample | undefined = reference.samplesInDecodeOrder[index];
      assert.ok(expected !== undefined);
      assert.equal(sample.isKeyFrame, expected.isKeyFrame);
      assert.deepEqual(await fragmentedReader.read(sample.offset, sample.size), await referenceReader.read(expected.offset, expected.size));
    }
  });
});

describe("ByteRangeReader", () => {
  let server: FakeRangeServer | null = null;

  afterEach(() => {
    server?.uninstall();
    server = null;
  });

  async function serve(isRangeSupported: boolean): Promise<FakeRangeServer> {
    server = new FakeRangeServer(await fixtureBytes(), isRangeSupported);
    server.install();
    return server;
  }

  it("downloads a file from a server without range support only once", async () => {
    const installed: FakeRangeServer = await serve(false);
    const reader: ByteRangeReader = new ByteRangeReader(VIDEO_URL);
    const table: Mp4SampleTable = await Mp4SampleTable.read(reader);
    const sample: Mp4Sample | undefined = table.samplesInDecodeOrder[0];
    assert.ok(sample !== undefined);
    assert.equal((await reader.read(sample.offset, sample.size)).length, sample.size);
    assert.equal(installed.requests.length, 1);
  });

  it("returns the bytes left at the end of the file and nothing past it", async () => {
    const bytes: Uint8Array<ArrayBuffer> = await fixtureBytes();
    await serve(true);
    const reader: ByteRangeReader = new ByteRangeReader(VIDEO_URL);
    assert.equal((await reader.read(bytes.length - 10, 100)).length, 10);
    assert.equal((await reader.read(bytes.length + 10, 100)).length, 0);
  });

  it("sends credentials only when the cross-origin mode asks for them", async () => {
    const installed: FakeRangeServer = await serve(true);
    await new ByteRangeReader(VIDEO_URL).read(0, 8);
    await new ByteRangeReader(VIDEO_URL, CrossOrigin.ANONYMOUS).read(0, 8);
    await new ByteRangeReader(VIDEO_URL, CrossOrigin.USE_CREDENTIALS).read(0, 8);
    assert.deepEqual(
      installed.requests.map((init: RequestInit) => init.credentials),
      ["same-origin", "same-origin", "include"],
    );
  });

  it("points at CORS when a URL cannot be fetched", async () => {
    const originalFetch: typeof fetch = globalThis.fetch;
    globalThis.fetch = (): Promise<Response> => Promise.reject(new TypeError("Failed to fetch"));
    try {
      await assert.rejects(new ByteRangeReader(VIDEO_URL).read(0, 8), /CORS/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("SequentialFrameDecoder", () => {
  beforeEach(() => {
    installFakeWebCodecs();
  });

  async function createDecoder(): Promise<SequentialFrameDecoder> {
    const source: Blob = await fixture();
    const reader: ByteRangeReader = new ByteRangeReader(source);
    return new SequentialFrameDecoder(await Mp4SampleTable.read(reader), reader);
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
