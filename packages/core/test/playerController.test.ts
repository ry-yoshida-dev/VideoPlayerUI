import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FrameTable, PlaybackState, PlayerController, PlayerStateError } from "../src/index.js";
import type { PlayerSnapshot, PresentedFrame } from "../src/index.js";
import { FakePlaybackEngine } from "./support/FakePlaybackEngine.js";

async function loadedPlayer(
  engine: FakePlaybackEngine = new FakePlaybackEngine(),
  timeline: { readonly startTimeId?: number; readonly endTimeId?: number; readonly samplingFrequency?: number } = {},
): Promise<PlayerController> {
  const controller: PlayerController = new PlayerController({ engine, timeline });
  await controller.load();
  return controller;
}

describe("PlayerController", () => {
  it("loads onto the first frame of the range", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine, { startTimeId: 11, endTimeId: 50 });
    const snapshot: PlayerSnapshot = controller.getSnapshot();
    assert.equal(snapshot.state, PlaybackState.PAUSED);
    assert.equal(snapshot.timeId, 11);
    assert.equal(snapshot.rangeStartSeconds, 1);
    assert.equal(snapshot.rangeEndSeconds, 5);
    assert.deepEqual(engine.seeks, [1.05]);
  });

  it("rejects commands before loading and empty ranges", async () => {
    const controller: PlayerController = new PlayerController({ engine: new FakePlaybackEngine() });
    await assert.rejects(controller.play(), PlayerStateError);
    const empty: PlayerController = new PlayerController({ engine: new FakePlaybackEngine(), timeline: { startTimeId: 500 } });
    await assert.rejects(empty.load(), RangeError);
    assert.equal(empty.getSnapshot().state, PlaybackState.FAILED);
  });

  it("seeks by seconds from the frame on screen and stays in range", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine);
    await controller.seekBy(3);
    assert.equal(controller.getSnapshot().timeId, 31);
    await controller.seekBy(-10);
    assert.equal(controller.getSnapshot().timeId, 1);
    await controller.seekBy(30);
    assert.equal(controller.getSnapshot().timeId, 100);
    await controller.seekToSeconds(4.26);
    assert.equal(controller.getSnapshot().timeId, 43);
  });

  it("coalesces rapid seeks into the latest target", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine);
    engine.seeks.length = 0;
    await Promise.all([1, 2, 3, 4].map((seconds: number) => controller.seekToSeconds(seconds)));
    assert.deepEqual(engine.seeks, [1.05, 4.05]);
    assert.equal(controller.getSnapshot().timeId, 41);
  });

  it("steps along sampled time ids", async () => {
    const controller: PlayerController = await loadedPlayer(new FakePlaybackEngine(), { samplingFrequency: 5 });
    await controller.stepForward();
    await controller.stepForward();
    assert.equal(controller.getSnapshot().timeId, 11);
    await controller.seekToTimeId(13);
    await controller.stepBackward();
    assert.equal(controller.getSnapshot().timeId, 11);
  });

  it("reports frames and stops at the range end", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine, { endTimeId: 20 });
    const frames: number[] = [];
    controller.subscribeFrame((frame: PresentedFrame) => frames.push(frame.timeId));
    await controller.play();
    assert.equal(controller.getSnapshot().state, PlaybackState.PLAYING);
    engine.present(1.5);
    assert.equal(controller.getSnapshot().timeId, 16);
    engine.present(2.0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(controller.getSnapshot().state, PlaybackState.ENDED);
    assert.equal(controller.getSnapshot().timeId, 20);
    assert.equal(engine.isPlaying, false);
    assert.deepEqual(frames, [1, 16, 21, 20]);
    await controller.play();
    assert.equal(controller.getSnapshot().timeId, 1);
  });

  it("loops back to the range start when looping is turned on during playback", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine(FrameTable.fromConstantFrameRate(10, 10));
    const controller: PlayerController = await loadedPlayer(engine);
    await controller.play();
    engine.present(0.5);
    controller.setLooping(true);
    engine.end();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(controller.getSnapshot().state, PlaybackState.PLAYING);
    assert.equal(controller.getSnapshot().timeId, 1);
    assert.equal(engine.isPlaying, true);
  });

  it("loops at a range end before the media end", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine, { startTimeId: 11, endTimeId: 20 });
    controller.setLooping(true);
    await controller.play();
    engine.present(2.0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(controller.getSnapshot().state, PlaybackState.PLAYING);
    assert.equal(controller.getSnapshot().timeId, 11);
    assert.equal(engine.isPlaying, true);
  });

  it("stops at the media end without looping", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine(FrameTable.fromConstantFrameRate(10, 10));
    const controller: PlayerController = await loadedPlayer(engine);
    await controller.play();
    engine.end();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(controller.getSnapshot().state, PlaybackState.ENDED);
    assert.equal(controller.getSnapshot().timeId, 10);
  });

  it("forwards rate and mute to the engine", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = new PlayerController({ engine, playbackRate: 2, isMuted: true });
    await controller.load();
    assert.equal(engine.playbackRate, 2);
    assert.equal(engine.isMuted, true);
    controller.setPlaybackRate(0.5);
    assert.equal(engine.playbackRate, 0.5);
    assert.throws(() => controller.setPlaybackRate(0), RangeError);
    controller.dispose();
    assert.equal(engine.isDisposed, true);
  });

  it("settles on the frame on screen while paused", async () => {
    const controller: PlayerController = await loadedPlayer(new FakePlaybackEngine(), { startTimeId: 11 });
    const frame: PresentedFrame = await controller.settledFrame();
    assert.equal(frame.timeId, 11);
  });

  it("settles on the next presented frame while playing", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine);
    await controller.play();
    const settled: Promise<PresentedFrame> = controller.settledFrame();
    engine.present(2.5);
    assert.equal((await settled).timeId, 26);
  });

  it("settles on the frame on screen when playback pauses before the next frame", async () => {
    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const controller: PlayerController = await loadedPlayer(engine);
    await controller.play();
    engine.present(1.2);
    const settled: Promise<PresentedFrame> = controller.settledFrame();
    controller.pause();
    assert.equal((await settled).timeId, 13);
  });

  it("rejects a pending settled frame when the player is disposed or fails", async () => {
    const disposed: PlayerController = await loadedPlayer();
    await disposed.play();
    const pendingOnDispose: Promise<PresentedFrame> = disposed.settledFrame();
    disposed.dispose();
    await assert.rejects(pendingOnDispose, PlayerStateError);

    const engine: FakePlaybackEngine = new FakePlaybackEngine();
    const failing: PlayerController = await loadedPlayer(engine);
    await failing.play();
    const pendingOnFailure: Promise<PresentedFrame> = failing.settledFrame();
    engine.fail(new Error("decode error"));
    await assert.rejects(pendingOnFailure, PlayerStateError);
  });
});
