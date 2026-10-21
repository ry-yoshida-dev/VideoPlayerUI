import { ListenerSet } from "../event/ListenerSet.js";
import type { Unsubscribe } from "../event/Unsubscribe.js";
import type { FrameTable } from "../timeline/FrameTable.js";
import { Timeline } from "../timeline/Timeline.js";
import { TimelineParameters } from "../timeline/TimelineParameters.js";
import type { MediaInfo } from "./MediaInfo.js";
import type { PlaybackEngine } from "./PlaybackEngine.js";
import type { PlaybackEngineEvents } from "./PlaybackEngineEvents.js";
import { PlaybackState } from "./PlaybackState.js";
import { PlayOutcome } from "./PlayOutcome.js";
import type { PlayerControllerOptions } from "./PlayerControllerOptions.js";
import type { PlayerSnapshot } from "./PlayerSnapshot.js";
import { PlayerStateError } from "./PlayerStateError.js";
import type { PresentedFrame } from "./PresentedFrame.js";
import type { ReleaseHold } from "./ReleaseHold.js";

/**
 * Platform-independent player: owns the playback state machine and the
 * timeline, and drives a platform {@link PlaybackEngine}.
 *
 * UI layers read {@link PlayerController.getSnapshot} (React's
 * `useSyncExternalStore` contract) and draw overlays from
 * {@link PlayerController.subscribeFrame}, which fires once per frame on screen.
 */
export class PlayerController {
  /** Speed multipliers offered by default speed menus. */
  static readonly STANDARD_PLAYBACK_RATES: readonly number[] = [0.25, 0.5, 1, 1.5, 2, 4];

  private readonly engine: PlaybackEngine;
  private readonly timelineParameters: TimelineParameters;
  private readonly snapshotListeners: ListenerSet<void> = new ListenerSet();
  private readonly frameListeners: ListenerSet<PresentedFrame> = new ListenerSet();
  private readonly disposeListeners: ListenerSet<void> = new ListenerSet();
  private snapshot: PlayerSnapshot;
  private lastPresentedFrame: PresentedFrame | null = null;
  private pendingSeekSeconds: number | null = null;
  private seekChain: Promise<void> | null = null;
  private readonly holdTokens: Set<symbol> = new Set();
  private enginePlayRequestCount: number = 0;
  private pendingEnginePlayCount: number = 0;
  private isDisposed: boolean = false;

  /**
   * Create an idle player.
   *
   * @param options - Engine, timeline parameters and initial settings.
   * @throws RangeError When the timeline parameters or playback rate are invalid.
   */
  constructor(options: PlayerControllerOptions) {
    this.engine = options.engine;
    this.timelineParameters =
      options.timeline instanceof TimelineParameters ? options.timeline : new TimelineParameters(options.timeline ?? {});
    const playbackRate: number = options.playbackRate ?? 1;
    PlayerController.requireValidRate(playbackRate);
    this.snapshot = {
      state: PlaybackState.IDLE,
      timeline: null,
      mediaInfo: null,
      timeId: null,
      presentationSeconds: 0,
      rangeStartSeconds: 0,
      rangeEndSeconds: 0,
      isHeld: false,
      playbackRate,
      isMuted: options.isMuted ?? false,
      isLooping: options.isLooping ?? false,
      error: null,
    };
  }

  /**
   * Register a listener for snapshot changes.
   *
   * @param listener - Called after every snapshot change.
   * @returns A function removing the listener.
   */
  readonly subscribe = (listener: () => void): Unsubscribe => this.snapshotListeners.add(listener);

  /**
   * Current snapshot; the same object until the state changes.
   *
   * @returns The snapshot.
   */
  readonly getSnapshot = (): PlayerSnapshot => this.snapshot;

  /**
   * Register a listener called for every frame that reaches the screen,
   * for drawing overlays in step with the video.
   *
   * @param listener - Called with the frame on screen.
   * @returns A function removing the listener.
   */
  subscribeFrame(listener: (frame: PresentedFrame) => void): Unsubscribe {
    if (this.lastPresentedFrame !== null) {
      listener(this.lastPresentedFrame);
    }
    return this.frameListeners.add(listener);
  }

  /**
   * Frame on screen once it stops changing: the next frame presented while
   * playing or seeking, the frame on screen otherwise.
   *
   * @returns The frame.
   * @throws PlayerStateError When the media is not loaded, or the player
   *   fails or is disposed before a frame is presented.
   */
  async settledFrame(): Promise<PresentedFrame> {
    this.requireLoaded("settledFrame");
    const settledFrame: PresentedFrame | null = this.settledFrameOrNull();
    if (settledFrame !== null) {
      return settledFrame;
    }
    return await new Promise<PresentedFrame>((resolve: (frame: PresentedFrame) => void, reject: (error: Error) => void): void => {
      const unsubscribes: Unsubscribe[] = [];
      const finish: (settle: () => void) => void = (settle: () => void): void => {
        for (const unsubscribe of unsubscribes) {
          unsubscribe();
        }
        settle();
      };
      unsubscribes.push(
        this.frameListeners.add((frame: PresentedFrame) => finish(() => resolve(frame))),
        this.snapshotListeners.add(() => {
          if (this.snapshot.state === PlaybackState.FAILED) {
            finish(() => reject(new PlayerStateError("The player failed before a frame was presented", { cause: this.snapshot.error })));
            return;
          }
          const frame: PresentedFrame | null = this.settledFrameOrNull();
          if (frame !== null) {
            finish(() => resolve(frame));
          }
        }),
        this.disposeListeners.add(() => finish(() => reject(new PlayerStateError("The player was disposed before a frame was presented")))),
      );
    });
  }

  /**
   * Open the media, build the timeline and show the range's first frame.
   *
   * @throws PlayerStateError When the player was already loaded or disposed.
   * @throws RangeError When the timeline range holds no frame.
   */
  async load(): Promise<void> {
    if (this.isDisposed || this.snapshot.state !== PlaybackState.IDLE) {
      throw new PlayerStateError(`load() needs an idle player, the player is ${this.snapshot.state}`);
    }
    this.update({ state: PlaybackState.LOADING });
    try {
      const mediaInfo: MediaInfo = await this.engine.load(this.createEngineEvents());
      const timeline: Timeline = new Timeline(this.timelineParameters, mediaInfo.frameTable.frameCount);
      if (timeline.isEmpty) {
        throw new RangeError(
          `startTimeId ${timeline.rangeStartTimeId} lies past the last time id ${timeline.mediaLastTimeId} of the media`,
        );
      }
      const frameTable: FrameTable = mediaInfo.frameTable;
      const rangeStartIndex: number = timeline.mediaIndexOf(timeline.rangeStartTimeId);
      const rangeEndIndex: number = timeline.mediaIndexOf(timeline.clampToRange(timeline.rangeEndTimeId));
      this.engine.setPlaybackRate(this.snapshot.playbackRate);
      this.engine.setMuted(this.snapshot.isMuted);
      this.update({
        state: PlaybackState.PAUSED,
        timeline,
        mediaInfo,
        timeId: timeline.rangeStartTimeId,
        presentationSeconds: frameTable.timestampOf(rangeStartIndex),
        rangeStartSeconds: frameTable.timestampOf(rangeStartIndex),
        rangeEndSeconds: rangeEndIndex + 1 < frameTable.frameCount ? frameTable.timestampOf(rangeEndIndex + 1) : frameTable.endSeconds,
      });
      await this.requestSeek(frameTable.seekTargetOf(rangeStartIndex));
    } catch (error: unknown) {
      this.fail(error);
      throw error;
    }
  }

  /**
   * Start playback, restarting from the range start after the end.
   *
   * @throws PlayerStateError When the media is not loaded.
   */
  async play(): Promise<void> {
    const timeline: Timeline = this.requireLoaded("play");
    if (this.snapshot.state === PlaybackState.PLAYING) {
      return;
    }
    if (this.snapshot.state === PlaybackState.ENDED || this.currentTimeId() >= timeline.rangeEndTimeId) {
      await this.seekToTimeId(timeline.rangeStartTimeId);
    }
    this.update({ state: PlaybackState.PLAYING });
    await this.startEngine();
  }

  /**
   * Stop on the current frame.
   *
   * @throws PlayerStateError When the media is not loaded.
   */
  pause(): void {
    this.requireLoaded("pause");
    this.engine.pause();
    if (this.snapshot.state === PlaybackState.PLAYING) {
      this.update({ state: PlaybackState.PAUSED });
    }
  }

  /**
   * Hold playback on the current frame without leaving the playing state, the
   * way a streaming player waits for data: controls keep showing pause.
   * Playback continues once every hold is released. Leaving the playing state,
   * for example by pausing, ends every hold, as does playback started from
   * outside the controller. Does nothing unless playing.
   *
   * @returns A function ending this hold.
   * @throws PlayerStateError When the media is not loaded.
   */
  hold(): ReleaseHold {
    this.requireLoaded("hold");
    if (this.snapshot.state !== PlaybackState.PLAYING) {
      return (): Promise<void> => Promise.resolve();
    }
    const token: symbol = Symbol("hold");
    this.holdTokens.add(token);
    if (this.holdTokens.size === 1) {
      this.update({ isHeld: true });
      this.engine.pause();
    }
    return (): Promise<void> => this.releaseHold(token);
  }

  /**
   * Pause when playing, play otherwise.
   *
   * @throws PlayerStateError When the media is not loaded.
   */
  async togglePlayback(): Promise<void> {
    if (this.snapshot.state === PlaybackState.PLAYING) {
      this.pause();
      return;
    }
    await this.play();
  }

  /**
   * Show the stored frame at or before a time id, kept inside the range.
   *
   * @param timeId - Target time id; snapped onto the pre-sampled grid.
   * @throws PlayerStateError When the media is not loaded.
   */
  async seekToTimeId(timeId: number): Promise<void> {
    const timeline: Timeline = this.requireLoaded("seekToTimeId");
    const frameTable: FrameTable = this.requireMediaInfo().frameTable;
    const targetTimeId: number = timeline.clampToRange(timeId);
    const mediaIndex: number = timeline.mediaIndexOf(targetTimeId);
    this.update({
      state: this.snapshot.state === PlaybackState.ENDED ? PlaybackState.PAUSED : this.snapshot.state,
      timeId: targetTimeId,
      presentationSeconds: frameTable.timestampOf(mediaIndex),
    });
    await this.requestSeek(frameTable.seekTargetOf(mediaIndex));
  }

  /**
   * Show the frame on screen at a presentation time, kept inside the range;
   * the operation behind a seek bar.
   *
   * @param seconds - Presentation time in seconds.
   * @throws PlayerStateError When the media is not loaded.
   */
  async seekToSeconds(seconds: number): Promise<void> {
    const timeline: Timeline = this.requireLoaded("seekToSeconds");
    const frameTable: FrameTable = this.requireMediaInfo().frameTable;
    await this.seekToTimeId(timeline.timeIdOf(frameTable.indexAt(seconds)));
  }

  /**
   * Jump by a duration from the frame on screen, as the 10 second back and
   * 30 second forward buttons.
   *
   * @param deltaSeconds - Signed jump in seconds.
   * @throws PlayerStateError When the media is not loaded.
   */
  async seekBy(deltaSeconds: number): Promise<void> {
    this.requireLoaded("seekBy");
    await this.seekToSeconds(this.snapshot.presentationSeconds + deltaSeconds);
  }

  /**
   * Pause and move to the next sampled time id.
   *
   * @throws PlayerStateError When the media is not loaded.
   */
  async stepForward(): Promise<void> {
    const timeline: Timeline = this.requireLoaded("stepForward");
    this.pause();
    const next: number | null = timeline.nextSampledTimeId(this.currentTimeId());
    if (next !== null) {
      await this.seekToTimeId(next);
    }
  }

  /**
   * Pause and move to the previous sampled time id.
   *
   * @throws PlayerStateError When the media is not loaded.
   */
  async stepBackward(): Promise<void> {
    const timeline: Timeline = this.requireLoaded("stepBackward");
    this.pause();
    const previous: number | null = timeline.previousSampledTimeId(this.currentTimeId());
    if (previous !== null) {
      await this.seekToTimeId(previous);
    }
  }

  /**
   * Set the speed multiplier.
   *
   * @param rate - Positive multiplier; 1 is real time.
   * @throws RangeError When the rate is not positive and finite.
   */
  setPlaybackRate(rate: number): void {
    PlayerController.requireValidRate(rate);
    if (this.snapshot.mediaInfo !== null) {
      this.engine.setPlaybackRate(rate);
    }
    this.update({ playbackRate: rate });
  }

  /**
   * Silence or restore the audio.
   *
   * @param isMuted - Whether audio is silenced.
   */
  setMuted(isMuted: boolean): void {
    if (this.snapshot.mediaInfo !== null) {
      this.engine.setMuted(isMuted);
    }
    this.update({ isMuted });
  }

  /**
   * Choose whether playback restarts from the range start at the range end.
   *
   * @param isLooping - Whether to loop.
   */
  setLooping(isLooping: boolean): void {
    this.update({ isLooping });
  }

  /**
   * Release the engine and every listener; the controller is unusable afterwards.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.holdTokens.clear();
    this.engine.dispose();
    this.disposeListeners.notify();
    this.disposeListeners.clear();
    this.frameListeners.clear();
    this.snapshotListeners.clear();
  }

  private createEngineEvents(): PlaybackEngineEvents {
    return {
      onFramePresented: (presentationSeconds: number): void => this.handleFramePresented(presentationSeconds),
      onPlayingChange: (isPlaying: boolean): void => this.handlePlayingChange(isPlaying),
      onEnded: (): void => this.handleRangeEnd(),
      onError: (error: Error): void => this.fail(error),
    };
  }

  private handleFramePresented(presentationSeconds: number): void {
    const timeline: Timeline | null = this.snapshot.timeline;
    const mediaInfo: MediaInfo | null = this.snapshot.mediaInfo;
    if (this.isDisposed || timeline === null || mediaInfo === null) {
      return;
    }
    const mediaIndex: number = mediaInfo.frameTable.indexAt(presentationSeconds);
    const frame: PresentedFrame = {
      timeId: timeline.timeIdOf(mediaIndex),
      mediaIndex,
      presentationSeconds: mediaInfo.frameTable.timestampOf(mediaIndex),
    };
    this.lastPresentedFrame = frame;
    this.frameListeners.notify(frame);
    if (this.seekChain !== null) {
      return;
    }
    if (this.snapshot.state === PlaybackState.PLAYING && frame.timeId > timeline.rangeEndTimeId) {
      this.handleRangeEnd();
      return;
    }
    if (frame.timeId !== this.snapshot.timeId) {
      this.update({ timeId: frame.timeId, presentationSeconds: frame.presentationSeconds });
    }
  }

  private handlePlayingChange(isPlaying: boolean): void {
    if (this.isDisposed) {
      return;
    }
    switch (this.snapshot.state) {
      case PlaybackState.PLAYING:
        if (this.seekChain !== null || this.pendingEnginePlayCount > 0) {
          return;
        }
        if (isPlaying && this.snapshot.isHeld) {
          this.holdTokens.clear();
          this.update({ isHeld: false });
        } else if (!isPlaying && !this.snapshot.isHeld) {
          this.update({ state: PlaybackState.PAUSED });
        }
        return;
      case PlaybackState.PAUSED:
      case PlaybackState.ENDED:
        if (isPlaying) {
          this.update({ state: PlaybackState.PLAYING });
        }
        return;
      case PlaybackState.IDLE:
      case PlaybackState.LOADING:
      case PlaybackState.FAILED:
        return;
    }
  }

  private handleRangeEnd(): void {
    const timeline: Timeline | null = this.snapshot.timeline;
    if (this.isDisposed || timeline === null) {
      return;
    }
    if (this.snapshot.isLooping) {
      void this.restartFromRangeStart(timeline).catch((error: unknown) => this.fail(error));
      return;
    }
    this.engine.pause();
    void this.seekToTimeId(timeline.rangeEndTimeId)
      .then(() => this.update({ state: PlaybackState.ENDED }))
      .catch((error: unknown) => this.fail(error));
  }

  private async restartFromRangeStart(timeline: Timeline): Promise<void> {
    await this.seekToTimeId(timeline.rangeStartTimeId);
    if (this.snapshot.isHeld) {
      return;
    }
    this.update({ state: PlaybackState.PLAYING });
    await this.startEngine();
  }

  private async releaseHold(token: symbol): Promise<void> {
    if (!this.holdTokens.delete(token) || this.holdTokens.size > 0) {
      return;
    }
    this.update({ isHeld: false });
    await this.startEngine();
  }

  private async startEngine(): Promise<void> {
    this.enginePlayRequestCount += 1;
    const playRequest: number = this.enginePlayRequestCount;
    this.pendingEnginePlayCount += 1;
    let outcome: PlayOutcome;
    try {
      outcome = await this.engine.play();
    } catch (error: unknown) {
      this.pauseUnlessSuperseded(playRequest);
      throw error;
    } finally {
      this.pendingEnginePlayCount -= 1;
    }
    switch (outcome) {
      case PlayOutcome.STARTED:
        return;
      case PlayOutcome.INTERRUPTED:
        this.pauseUnlessSuperseded(playRequest);
        return;
    }
  }

  private pauseUnlessSuperseded(playRequest: number): void {
    const isLatestRequest: boolean = playRequest === this.enginePlayRequestCount;
    if (isLatestRequest && this.snapshot.state === PlaybackState.PLAYING && !this.snapshot.isHeld) {
      this.update({ state: PlaybackState.PAUSED });
    }
  }

  private requestSeek(seconds: number): Promise<void> {
    this.pendingSeekSeconds = seconds;
    if (this.seekChain === null) {
      this.seekChain = this.drainSeeks().finally(() => {
        this.seekChain = null;
      });
    }
    return this.seekChain;
  }

  private async drainSeeks(): Promise<void> {
    while (this.pendingSeekSeconds !== null) {
      const seconds: number = this.pendingSeekSeconds;
      this.pendingSeekSeconds = null;
      await this.engine.seek(seconds);
    }
  }

  private settledFrameOrNull(): PresentedFrame | null {
    const isAdvancing: boolean = this.snapshot.state === PlaybackState.PLAYING && !this.snapshot.isHeld;
    const isChanging: boolean = isAdvancing || this.seekChain !== null;
    return isChanging ? null : this.lastPresentedFrame;
  }

  private currentTimeId(): number {
    const timeline: Timeline = this.requireLoaded("currentTimeId");
    return this.snapshot.timeId ?? timeline.rangeStartTimeId;
  }

  private requireLoaded(command: string): Timeline {
    const timeline: Timeline | null = this.snapshot.timeline;
    if (this.isDisposed || timeline === null || this.snapshot.state === PlaybackState.FAILED) {
      throw new PlayerStateError(`${command}() needs loaded media, the player is ${this.isDisposed ? "disposed" : this.snapshot.state}`);
    }
    return timeline;
  }

  private requireMediaInfo(): MediaInfo {
    if (this.snapshot.mediaInfo === null) {
      throw new PlayerStateError("The media is not loaded");
    }
    return this.snapshot.mediaInfo;
  }

  private fail(error: unknown): void {
    this.update({
      state: PlaybackState.FAILED,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  private update(changes: Partial<PlayerSnapshot>): void {
    const next: PlayerSnapshot = { ...this.snapshot, ...changes };
    if (next.state !== PlaybackState.PLAYING) {
      this.holdTokens.clear();
    }
    this.snapshot = { ...next, isHeld: this.holdTokens.size > 0 };
    this.snapshotListeners.notify();
  }

  private static requireValidRate(rate: number): void {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new RangeError(`playbackRate must be positive and finite, given: ${rate}`);
    }
  }
}
