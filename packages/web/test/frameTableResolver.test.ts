import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import type { FrameTable } from "@video-player-ui/core";

import {
  ConstantFrameRateResolver,
  CrossOrigin,
  FallbackFrameTableResolver,
  FrameTableResolutionError,
  Mp4FrameTableResolver,
} from "../src/index.js";

describe("frame table resolvers", () => {
  it("derives a constant frame rate table from the duration", async () => {
    const frameTable: FrameTable = await new ConstantFrameRateResolver(25).resolve({
      source: "unused.webm",
      crossOrigin: CrossOrigin.NONE,
      durationSeconds: 2,
    });
    assert.equal(frameTable.frameCount, 50);
    assert.equal(frameTable.timestampOf(10), 0.4);
  });

  it("rejects a constant frame rate without a finite duration", async () => {
    await assert.rejects(
      new ConstantFrameRateResolver(25).resolve({
        source: "live.m3u8",
        crossOrigin: CrossOrigin.NONE,
        durationSeconds: Number.POSITIVE_INFINITY,
      }),
      FrameTableResolutionError,
    );
    assert.throws(() => new ConstantFrameRateResolver(0), RangeError);
  });

  it("falls back to the next resolver when the file is not MP4", async () => {
    const resolver: FallbackFrameTableResolver = new FallbackFrameTableResolver([
      new Mp4FrameTableResolver(),
      new ConstantFrameRateResolver(10),
    ]);
    const frameTable: FrameTable = await resolver.resolve({
      source: new Blob([new Uint8Array(64)]),
      crossOrigin: CrossOrigin.NONE,
      durationSeconds: 1,
    });
    assert.equal(frameTable.frameCount, 10);
  });

  it("reads the exact frame table of an MP4 file", async () => {
    const bytes: Buffer = await readFile(new URL("./fixtures/bframes.mp4", import.meta.url));
    const frameTable: FrameTable = await new Mp4FrameTableResolver().resolve({
      source: new Blob([new Uint8Array(bytes)]),
      crossOrigin: CrossOrigin.NONE,
      durationSeconds: 1.2,
    });
    assert.equal(frameTable.frameCount, 12);
  });
});
