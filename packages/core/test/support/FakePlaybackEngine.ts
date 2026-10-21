import type { MediaInfo, PlaybackEngine, PlaybackEngineEvents } from "../../src/index.js";
import { FrameTable, PlayOutcome } from "../../src/index.js";

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
  /** Whether `play()` stays pending until {@link FakePlaybackEngine.confirmPlaying}, as in browsers. */
  isPlayDeferred: boolean = false;
  private events: PlaybackEngineEvents | null = null;
  private settlePendingPlay: ((outcome: PlayOutcome) => void) | null = null;

  constructor(frameTable: FrameTable = FrameTable.fromConstantFrameRate(100, 10)) {
    this.frameTable = frameTable;
  }

  load(events: PlaybackEngineEvents): Promise<MediaInfo> {
    this.events = events;
    return Promise.resolve({ frameSize: { width: 640, height: 480 }, frameTable: this.frameTable });
  }

  play(): Promise<PlayOutcome> {
    this.isPlaying = true;
    if (this.isPlayDeferred) {
      return new Promise<PlayOutcome>((resolve: (outcome: PlayOutcome) => void): void => {
        this.settlePendingPlay = resolve;
      });
    }
    this.requireEvents().onPlayingChange(true);
    return Promise.resolve(PlayOutcome.STARTED);
  }

  pause(): void {
    this.isPlaying = false;
    this.takePendingPlay()?.(PlayOutcome.INTERRUPTED);
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

  /**
   * Report the pause the way browsers do, after the command and outside the controller's call.
   */
  reportPaused(): void {
    this.requireEvents().onPlayingChange(false);
  }

  /**
   * Pause from outside the controller, as native controls or media keys do:
   * report the pause, then interrupt a deferred `play()`.
   */
  pauseExternally(): void {
    this.isPlaying = false;
    this.requireEvents().onPlayingChange(false);
    this.takePendingPlay()?.(PlayOutcome.INTERRUPTED);
  }

  /**
   * Play from outside the controller, as native controls or media keys do.
   */
  playExternally(): void {
    this.isPlaying = true;
    this.requireEvents().onPlayingChange(true);
  }

  /**
   * Settle a deferred `play()` the way browsers do: report playing, then resolve.
   */
  confirmPlaying(): void {
    const settlePendingPlay: ((outcome: PlayOutcome) => void) | null = this.takePendingPlay();
    if (settlePendingPlay === null) {
      throw new Error("No play() is pending");
    }
    this.requireEvents().onPlayingChange(true);
    settlePendingPlay(PlayOutcome.STARTED);
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

  private takePendingPlay(): ((outcome: PlayOutcome) => void) | null {
    const settlePendingPlay: ((outcome: PlayOutcome) => void) | null = this.settlePendingPlay;
    this.settlePendingPlay = null;
    return settlePendingPlay;
  }

  private requireEvents(): PlaybackEngineEvents {
    if (this.events === null) {
      throw new Error("The engine was not loaded");
    }
    return this.events;
  }
}
