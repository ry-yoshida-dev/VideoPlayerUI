import type { MediaInfo, PlaybackEngine, PlaybackEngineEvents } from "../../src/index.js";
import { FrameTable } from "../../src/index.js";

/**
 * Engine that records commands and lets tests present frames by hand.
 */
export class FakePlaybackEngine implements PlaybackEngine {
  readonly frameTable: FrameTable;
  readonly seeks: number[] = [];
  playbackRate: number = 1;
  isMuted: boolean = false;
  isPlaying: boolean = false;
  isDisposed: boolean = false;
  private events: PlaybackEngineEvents | null = null;

  constructor(frameTable: FrameTable = FrameTable.fromConstantFrameRate(100, 10)) {
    this.frameTable = frameTable;
  }

  load(events: PlaybackEngineEvents): Promise<MediaInfo> {
    this.events = events;
    return Promise.resolve({ frameSize: { width: 640, height: 480 }, frameTable: this.frameTable });
  }

  play(): Promise<void> {
    this.isPlaying = true;
    this.requireEvents().onPlayingChange(true);
    return Promise.resolve();
  }

  pause(): void {
    this.isPlaying = false;
  }

  async seek(presentationSeconds: number): Promise<void> {
    this.seeks.push(presentationSeconds);
    await Promise.resolve();
    this.requireEvents().onFramePresented(presentationSeconds);
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  setMuted(isMuted: boolean): void {
    this.isMuted = isMuted;
  }

  dispose(): void {
    this.isDisposed = true;
  }

  present(presentationSeconds: number): void {
    this.requireEvents().onFramePresented(presentationSeconds);
  }

  fail(error: Error): void {
    this.requireEvents().onError(error);
  }

  /**
   * Reach the end of the media the way browsers report it: `pause` first, then `ended`.
   */
  end(): void {
    this.isPlaying = false;
    this.requireEvents().onPlayingChange(false);
    this.requireEvents().onEnded();
  }

  private requireEvents(): PlaybackEngineEvents {
    if (this.events === null) {
      throw new Error("The engine was not loaded");
    }
    return this.events;
  }
}
