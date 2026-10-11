import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { TestContext } from "node:test";

import { AnalysisScheduler } from "@video-player-ui/analysis";
import type { AnalysisRequest } from "@video-player-ui/analysis";
import { StreamingAnnotationSource } from "@video-player-ui/annotations";
import { FrameTable, PlayerController } from "@video-player-ui/core";
import type { TimelineParametersInit } from "@video-player-ui/core";

import { DecodingLookahead } from "../src/index.js";
import { installFakeCanvasDocument } from "./support/FakeCanvasDocument.js";
import { FakeLookaheadDecoder } from "./support/FakeLookaheadDecoder.js";
import type { FakeDecodedVideoFrame } from "./support/FakeLookaheadDecoder.js";
import { FakePlaybackEngine } from "./support/FakePlaybackEngine.js";
import { ImmediateAnalyzer } from "./support/ImmediateAnalyzer.js";

const FRAME_COUNT: number = 100;
const FRAMES_PER_SECOND: number = 10;
const WAIT_TIMEOUT_MILLISECONDS: number = 2000;

interface Harness {
  readonly controller: PlayerController;
  readonly decoder: FakeLookaheadDecoder;
  readonly analyzer: ImmediateAnalyzer;
  readonly source: StreamingAnnotationSource;
  readonly scheduler: AnalysisScheduler;
  readonly lookahead: DecodingLookahead;
}

async function startHarness(timeline: TimelineParametersInit = {}): Promise<Harness> {
  const controller: PlayerController = new PlayerController({
    engine: new FakePlaybackEngine(FrameTable.fromConstantFrameRate(FRAME_COUNT, FRAMES_PER_SECOND)),
    timeline,
  });
  await controller.load();
  const decoder: FakeLookaheadDecoder = new FakeLookaheadDecoder(FRAME_COUNT);
  const analyzer: ImmediateAnalyzer = new ImmediateAnalyzer();
  const source: StreamingAnnotationSource = new StreamingAnnotationSource();
  const scheduler: AnalysisScheduler = new AnalysisScheduler({ analyzer, source, maxInFlight: 1 });
  const lookahead: DecodingLookahead = new DecodingLookahead({ decoder, controller, scheduler, leadSeconds: 0.5, capture: {} });
  lookahead.start();
  return { controller, decoder, analyzer, source, scheduler, lookahead };
}

async function waitUntil(condition: () => boolean): Promise<void> {
  const deadline: number = Date.now() + WAIT_TIMEOUT_MILLISECONDS;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error("The condition did not hold in time");
    }
    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 5));
  }
}

const pause = (milliseconds: number): Promise<unknown> =>
  new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, milliseconds));

const sentTimeIds = (analyzer: ImmediateAnalyzer): number[] => analyzer.requests.map((request: AnalysisRequest) => request.timeId);

const analyzedCount = (harness: Harness): number => harness.scheduler.getSnapshot().analyzedFrameCount;

async function stop(harness: Harness): Promise<void> {
  harness.lookahead.dispose();
  harness.scheduler.dispose();
  harness.controller.dispose();
  await pause(20);
}

describe("DecodingLookahead", () => {
  beforeEach(() => {
    installFakeCanvasDocument();
  });

  it("analyzes the frames within the lead of the paused playhead", async (context: TestContext) => {
    const harness: Harness = await startHarness();
    context.after(() => stop(harness));
    await waitUntil(() => analyzedCount(harness) === 6);
    await pause(50);
    assert.deepEqual(sentTimeIds(harness.analyzer), [1, 2, 3, 4, 5, 6]);
    assert.equal(harness.source.annotationsAt(4)[0]?.label, "frame-4");
    assert.deepEqual(harness.decoder.startIndices, [0]);
  });

  it("restarts decoding at the playhead after a seek", async (context: TestContext) => {
    const harness: Harness = await startHarness();
    context.after(() => stop(harness));
    await waitUntil(() => analyzedCount(harness) === 6);
    await harness.controller.seekToTimeId(51);
    harness.lookahead.notify();
    await waitUntil(() => analyzedCount(harness) === 12);
    assert.deepEqual(sentTimeIds(harness.analyzer).slice(6), [51, 52, 53, 54, 55, 56]);
    assert.deepEqual(harness.decoder.startIndices, [0, 50]);
  });

  it("stays inside the timeline range", async (context: TestContext) => {
    const harness: Harness = await startHarness({ endTimeId: 4 });
    context.after(() => stop(harness));
    await waitUntil(() => analyzedCount(harness) === 4);
    await pause(50);
    assert.deepEqual(sentTimeIds(harness.analyzer), [1, 2, 3, 4]);
  });

  it("releases every decoded frame once disposed", async () => {
    const harness: Harness = await startHarness();
    await waitUntil(() => analyzedCount(harness) === 6);
    await stop(harness);
    assert.ok(harness.decoder.frames.length > 0);
    assert.ok(harness.decoder.frames.every((frame: FakeDecodedVideoFrame) => frame.isClosed));
  });
});
