import type { Annotation, StreamingAnnotationSource } from "@video-player-ui/annotations";
import { ListenerSet } from "@video-player-ui/core";
import type { Unsubscribe } from "@video-player-ui/core";

import type { AnalysisRequest } from "./AnalysisRequest.js";
import type { AnalysisSchedulerOptions } from "./AnalysisSchedulerOptions.js";
import { AnalysisState } from "./AnalysisState.js";
import type { AnalysisStatus } from "./AnalysisStatus.js";
import type { FrameAnalyzer } from "./FrameAnalyzer.js";
import type { FrameCapturer } from "./FrameCapturer.js";
import type { QueuedCapture } from "./QueuedCapture.js";

/**
 * Sends frames to an analyzer with a bounded number of requests in flight
 * and stores the results under the time id of each frame.
 *
 * Frames arrive two ways. {@link AnalysisScheduler.offer} takes a frame only
 * if a slot is free right now, for frames that can be captured only at one
 * moment, such as frames decoded ahead of playback. {@link AnalysisScheduler.request}
 * keeps the latest frame waiting until a slot frees, for a paused or stepped
 * frame that must be analyzed. Frames analyzed or in flight are never sent
 * again, and failures pause sending for a retry delay.
 */
export class AnalysisScheduler {
  private readonly analyzer: FrameAnalyzer;
  private readonly source: StreamingAnnotationSource;
  private readonly maxInFlight: number;
  private readonly retryDelayMilliseconds: number;
  private readonly now: () => number;
  private readonly analyzedTimeIds: Set<number> = new Set();
  private readonly inFlightTimeIds: Set<number> = new Set();
  private readonly listeners: ListenerSet<void> = new ListenerSet();
  private status: AnalysisStatus = {
    state: AnalysisState.IDLE,
    inFlightTimeId: null,
    inFlightCount: 0,
    lastAnalyzedTimeId: null,
    lastLatencyMilliseconds: null,
    analyzedFrameCount: 0,
    error: null,
  };
  private queued: QueuedCapture | null = null;
  private isDisposed: boolean = false;
  private generation: number = 0;
  private failedAt: number | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Bind the scheduler to an analyzer and the source receiving its results.
   *
   * @param options - Analyzer, result source, concurrency and retry delay.
   * @throws RangeError When the concurrency is not a positive integer or the retry delay is negative.
   */
  constructor(options: AnalysisSchedulerOptions) {
    this.analyzer = options.analyzer;
    this.source = options.source;
    this.maxInFlight = options.maxInFlight ?? 1;
    this.retryDelayMilliseconds = options.retryDelayMilliseconds ?? 1000;
    this.now = options.now ?? ((): number => performance.now());
    if (!Number.isInteger(this.maxInFlight) || this.maxInFlight < 1) {
      throw new RangeError(`maxInFlight must be a positive integer, given: ${this.maxInFlight}`);
    }
    if (!(this.retryDelayMilliseconds >= 0)) {
      throw new RangeError(`retryDelayMilliseconds must not be negative, given: ${this.retryDelayMilliseconds}`);
    }
  }

  /**
   * Register a listener for status changes.
   *
   * @param listener - Called after every change.
   * @returns A function removing the listener.
   */
  readonly subscribe = (listener: () => void): Unsubscribe => this.listeners.add(listener);

  /**
   * Current status; the same object until it changes.
   *
   * @returns The status.
   */
  readonly getSnapshot = (): AnalysisStatus => this.status;

  /**
   * Whether a frame was analyzed or is being analyzed.
   *
   * @param timeId - Time id of the frame.
   * @returns True when sending it again would be redundant.
   */
  isCovered(timeId: number): boolean {
    return this.analyzedTimeIds.has(timeId) || this.inFlightTimeIds.has(timeId);
  }

  /**
   * Whether {@link AnalysisScheduler.offer} would send a frame now.
   *
   * @returns True when a slot is free and no retry delay is running.
   */
  hasCapacity(): boolean {
    return !this.isDisposed && this.inFlightTimeIds.size < this.maxInFlight && !this.isWaitingAfterFailure();
  }

  /**
   * Wait until {@link AnalysisScheduler.hasCapacity} holds, for producers
   * that pace themselves to the analyzer.
   *
   * @returns A promise resolving to true once a slot is free, or to false
   *   once the scheduler is disposed, so producers can stop and release
   *   what they hold.
   */
  whenCapacity(): Promise<boolean> {
    if (this.isDisposed) {
      return Promise.resolve(false);
    }
    if (this.hasCapacity()) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve: (isAvailable: boolean) => void) => {
      const unsubscribe: Unsubscribe = this.listeners.add(() => {
        if (this.isDisposed || this.hasCapacity()) {
          unsubscribe();
          resolve(!this.isDisposed);
        }
      });
    });
  }

  /**
   * Send a frame if a slot is free now; otherwise drop it.
   *
   * @param timeId - Time id of the frame.
   * @param capture - Encodes the frame; called synchronously when the frame is taken.
   * @returns True when the frame was sent.
   */
  offer(timeId: number, capture: FrameCapturer): boolean {
    if (this.isCovered(timeId) || !this.hasCapacity()) {
      return false;
    }
    this.start(timeId, capture);
    return true;
  }

  /**
   * Send a frame as soon as a slot frees, replacing any frame still waiting.
   *
   * @param timeId - Time id of the frame.
   * @param capture - Encodes the frame; called when the frame is sent.
   */
  request(timeId: number, capture: FrameCapturer): void {
    if (this.isDisposed || this.isCovered(timeId)) {
      return;
    }
    if (this.hasCapacity()) {
      this.start(timeId, capture);
      return;
    }
    this.queued = { timeId, capture };
  }

  /**
   * Forget every result, as after switching the analyzer's model or settings.
   */
  reset(): void {
    this.generation += 1;
    this.analyzedTimeIds.clear();
    this.inFlightTimeIds.clear();
    this.queued = null;
    this.failedAt = null;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.source.clear();
    this.update({
      state: AnalysisState.IDLE,
      inFlightTimeId: null,
      inFlightCount: 0,
      lastAnalyzedTimeId: null,
      lastLatencyMilliseconds: null,
      analyzedFrameCount: 0,
      error: null,
    });
  }

  /**
   * Stop scheduling; the analyzer stays usable and belongs to its creator.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.queued = null;
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
    }
    this.listeners.notify();
    this.listeners.clear();
  }

  private start(timeId: number, capture: FrameCapturer): void {
    const generation: number = this.generation;
    const startedAt: number = this.now();
    this.inFlightTimeIds.add(timeId);
    this.update({ state: AnalysisState.ANALYZING, inFlightTimeId: timeId, inFlightCount: this.inFlightTimeIds.size });
    void capture()
      .then((request: AnalysisRequest) => this.analyzer.analyze(request))
      .then(
        (annotations: readonly Annotation[]) => this.finish(generation, timeId, startedAt, annotations),
        (error: unknown) => this.fail(generation, timeId, error),
      );
  }

  private finish(generation: number, timeId: number, startedAt: number, annotations: readonly Annotation[]): void {
    if (this.isDisposed || generation !== this.generation) {
      return;
    }
    this.inFlightTimeIds.delete(timeId);
    this.analyzedTimeIds.add(timeId);
    this.source.put(timeId, annotations);
    this.failedAt = null;
    this.update({
      state: this.inFlightTimeIds.size > 0 ? AnalysisState.ANALYZING : AnalysisState.IDLE,
      inFlightCount: this.inFlightTimeIds.size,
      lastAnalyzedTimeId: Math.max(timeId, this.status.lastAnalyzedTimeId ?? timeId),
      lastLatencyMilliseconds: this.now() - startedAt,
      analyzedFrameCount: this.analyzedTimeIds.size,
      error: null,
    });
    this.startQueued();
  }

  private fail(generation: number, timeId: number, error: unknown): void {
    if (this.isDisposed || generation !== this.generation) {
      return;
    }
    this.inFlightTimeIds.delete(timeId);
    this.failedAt = this.now();
    this.update({
      state: AnalysisState.FAILED,
      inFlightCount: this.inFlightTimeIds.size,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    this.scheduleRetry();
  }

  private startQueued(): void {
    const queued: QueuedCapture | null = this.queued;
    if (queued === null || !this.hasCapacity()) {
      return;
    }
    this.queued = null;
    if (!this.isCovered(queued.timeId)) {
      this.start(queued.timeId, queued.capture);
    }
  }

  private isWaitingAfterFailure(): boolean {
    return this.failedAt !== null && this.now() - this.failedAt < this.retryDelayMilliseconds;
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.failedAt = null;
      this.startQueued();
      this.listeners.notify();
    }, this.retryDelayMilliseconds);
  }

  private update(changes: Partial<AnalysisStatus>): void {
    this.status = { ...this.status, ...changes };
    this.listeners.notify();
  }
}
