import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { StreamingAnnotationSource } from "@video-player-ui/annotations";

import { AnalysisScheduler, AnalysisState } from "../src/index.js";
import type { AnalysisRequest, FrameCapturer } from "../src/index.js";
import { ManualAnalyzer } from "./support/ManualAnalyzer.js";

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function captureOf(timeId: number): FrameCapturer {
  return (): Promise<AnalysisRequest> =>
    Promise.resolve({
      timeId,
      frame: { bytes: new ArrayBuffer(1), mimeType: "image/png", width: 1, height: 1 },
    });
}

function createScheduler(
  maxInFlight: number = 1,
  retryDelayMilliseconds: number = 1000,
): {
  readonly analyzer: ManualAnalyzer;
  readonly source: StreamingAnnotationSource;
  readonly scheduler: AnalysisScheduler;
} {
  const analyzer: ManualAnalyzer = new ManualAnalyzer();
  const source: StreamingAnnotationSource = new StreamingAnnotationSource();
  return { analyzer, source, scheduler: new AnalysisScheduler({ analyzer, source, maxInFlight, retryDelayMilliseconds }) };
}

const sentTimeIds = (analyzer: ManualAnalyzer): number[] => analyzer.requests.map((request: AnalysisRequest) => request.timeId);

describe("AnalysisScheduler", () => {
  it("stores results under the time id of the analyzed frame", async () => {
    const { analyzer, source, scheduler }: ReturnType<typeof createScheduler> = createScheduler();
    assert.equal(scheduler.offer(5, captureOf(5)), true);
    await settle();
    assert.equal(scheduler.getSnapshot().state, AnalysisState.ANALYZING);
    analyzer.succeed();
    await settle();
    assert.equal(source.annotationsAt(5)[0]?.label, "frame-5");
    assert.equal(scheduler.getSnapshot().state, AnalysisState.IDLE);
    assert.equal(scheduler.getSnapshot().lastAnalyzedTimeId, 5);
  });

  it("drops offered frames while every slot is busy", async () => {
    const { analyzer, scheduler }: ReturnType<typeof createScheduler> = createScheduler(2);
    assert.equal(scheduler.offer(1, captureOf(1)), true);
    assert.equal(scheduler.offer(2, captureOf(2)), true);
    assert.equal(scheduler.offer(3, captureOf(3)), false);
    assert.equal(scheduler.getSnapshot().inFlightCount, 2);
    await settle();
    analyzer.succeed();
    await settle();
    assert.equal(scheduler.offer(4, captureOf(4)), true);
    await settle();
    assert.deepEqual(sentTimeIds(analyzer), [1, 2, 4]);
  });

  it("keeps only the latest requested frame waiting", async () => {
    const { analyzer, scheduler }: ReturnType<typeof createScheduler> = createScheduler();
    scheduler.request(1, captureOf(1));
    scheduler.request(2, captureOf(2));
    scheduler.request(3, captureOf(3));
    await settle();
    analyzer.succeed();
    await settle();
    assert.deepEqual(sentTimeIds(analyzer), [1, 3]);
  });

  it("never sends a frame that is analyzed or in flight", async () => {
    const { analyzer, scheduler }: ReturnType<typeof createScheduler> = createScheduler(2);
    scheduler.offer(7, captureOf(7));
    assert.equal(scheduler.offer(7, captureOf(7)), false);
    await settle();
    analyzer.succeed();
    await settle();
    scheduler.request(7, captureOf(7));
    assert.equal(scheduler.isCovered(7), true);
    await settle();
    assert.deepEqual(sentTimeIds(analyzer), [7]);
  });

  it("reports failures, pauses, then sends the waiting frame", async () => {
    const { analyzer, scheduler }: ReturnType<typeof createScheduler> = createScheduler(1, 20);
    scheduler.offer(3, captureOf(3));
    await settle();
    analyzer.fail("server down");
    await settle();
    assert.equal(scheduler.getSnapshot().state, AnalysisState.FAILED);
    assert.equal(scheduler.getSnapshot().error?.message, "server down");
    assert.equal(scheduler.hasCapacity(), false);
    scheduler.request(3, captureOf(3));
    await settle();
    assert.equal(analyzer.requests.length, 1);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.deepEqual(sentTimeIds(analyzer), [3, 3]);
    analyzer.succeed();
    await settle();
    assert.equal(scheduler.getSnapshot().error, null);
  });

  it("signals when a slot frees", async () => {
    const { analyzer, scheduler }: ReturnType<typeof createScheduler> = createScheduler();
    scheduler.offer(1, captureOf(1));
    let isFree: boolean = false;
    void scheduler.whenCapacity().then((isAvailable: boolean) => {
      isFree = isAvailable;
    });
    await settle();
    assert.equal(isFree, false);
    analyzer.succeed();
    await settle();
    assert.equal(isFree, true);
  });

  it("releases waiting producers on disposal", async () => {
    const { scheduler }: ReturnType<typeof createScheduler> = createScheduler();
    scheduler.offer(1, captureOf(1));
    const waiting: Promise<boolean> = scheduler.whenCapacity();
    scheduler.dispose();
    assert.equal(await waiting, false);
    assert.equal(await scheduler.whenCapacity(), false);
  });

  it("drops results that arrive after a reset", async () => {
    const { analyzer, source, scheduler }: ReturnType<typeof createScheduler> = createScheduler();
    scheduler.offer(9, captureOf(9));
    await settle();
    scheduler.reset();
    analyzer.succeed();
    await settle();
    assert.deepEqual(source.annotationsAt(9), []);
    assert.equal(scheduler.isCovered(9), false);
    scheduler.dispose();
    assert.equal(scheduler.offer(10, captureOf(10)), false);
    assert.equal(analyzer.isClosed, false);
  });

  it("cancels a pending retry on reset", async () => {
    const { analyzer, scheduler }: ReturnType<typeof createScheduler> = createScheduler(1, 20);
    scheduler.offer(3, captureOf(3));
    await settle();
    analyzer.fail("server down");
    await settle();
    scheduler.reset();
    let notificationCount: number = 0;
    scheduler.subscribe(() => {
      notificationCount += 1;
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(notificationCount, 0);
    assert.equal(scheduler.getSnapshot().state, AnalysisState.IDLE);
  });
});
