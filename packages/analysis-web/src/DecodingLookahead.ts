import type { AnalysisRequest } from "@video-player-ui/analysis";
import { PlaybackState } from "@video-player-ui/core";
import type { FrameTable, MediaInfo, PlayerSnapshot, Timeline } from "@video-player-ui/core";
import { FrameCapture } from "@video-player-ui/web";
import type { DecodedFrame } from "@video-player-ui/web";

import type { DecodingLookaheadOptions } from "./DecodingLookaheadOptions.js";
import type { LookaheadWindow } from "./LookaheadWindow.js";

/**
 * Decodes the video ahead of the playhead with WebCodecs and feeds the
 * frames to the analysis scheduler at the pace the analyzer accepts them, so
 * results are ready before their frames are shown.
 *
 * Decoded frames carry their own timestamps, so every result is attached to
 * exactly the frame that was analyzed. During playback, frames whose result
 * could not arrive before they are shown are skipped, so the overlay becomes
 * exact again soon after a seek. While paused the next frames are analyzed
 * too, ready for stepping. Disposing the scheduler stops the look-ahead.
 */
export class DecodingLookahead {
  /** Wait between checks of the playhead while idle, in milliseconds. */
  static readonly IDLE_POLL_MILLISECONDS: number = 100;
  /** Pause after a decoding failure before retrying, in milliseconds. */
  static readonly RETRY_DELAY_MILLISECONDS: number = 1000;
  /** Frames the decoder may trail the playhead before it restarts there. */
  static readonly MAX_TRAILING_FRAMES: number = 2;
  /** Safety factor on the measured round trip when skipping frames that would arrive late. */
  static readonly LATENCY_MARGIN: number = 1.5;

  private readonly options: DecodingLookaheadOptions;
  private wake: (() => void) | null = null;
  private isDisposed: boolean = false;

  /**
   * Store the collaborators.
   *
   * @param options - Decoder, player, scheduler, lead and encoding.
   * @throws RangeError When the lead is negative.
   */
  constructor(options: DecodingLookaheadOptions) {
    if (!(options.leadSeconds >= 0)) {
      throw new RangeError(`leadSeconds must not be negative, given: ${options.leadSeconds}`);
    }
    this.options = options;
  }

  /**
   * Start decoding in the background.
   */
  start(): void {
    void this.run();
  }

  /**
   * Tell the look-ahead that the playhead or play state changed.
   */
  notify(): void {
    const wake: (() => void) | null = this.wake;
    this.wake = null;
    wake?.();
  }

  /**
   * Stop decoding and release the decoder.
   */
  dispose(): void {
    this.isDisposed = true;
    this.notify();
  }

  private async run(): Promise<void> {
    while (!this.isDisposed) {
      const window: LookaheadWindow | null = this.window();
      const startIndex: number | null = window === null ? null : this.firstUncovered(window);
      if (window === null || startIndex === null) {
        await this.waitForChange(DecodingLookahead.IDLE_POLL_MILLISECONDS);
        continue;
      }
      try {
        await this.decodeAhead(startIndex, window.playheadIndex);
      } catch (error: unknown) {
        this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
        await this.waitForChange(DecodingLookahead.RETRY_DELAY_MILLISECONDS);
      }
    }
  }

  private async decodeAhead(startIndex: number, anchorIndex: number): Promise<void> {
    for await (const decoded of this.options.decoder.decodeFrom(startIndex)) {
      if (!(await this.waitUntilWanted(decoded, anchorIndex))) {
        decoded.frame.close();
        return;
      }
      const timeId: number | null = this.timeIdOf(decoded.presentationIndex);
      if (timeId === null || this.options.scheduler.isCovered(timeId)) {
        decoded.frame.close();
        continue;
      }
      if (!(await this.options.scheduler.whenCapacity())) {
        decoded.frame.close();
        this.dispose();
        return;
      }
      if (this.isDisposed || this.mustRestart(decoded, anchorIndex)) {
        decoded.frame.close();
        return;
      }
      const isTaken: boolean = this.options.scheduler.offer(timeId, () => this.encode(timeId, decoded));
      if (!isTaken) {
        decoded.frame.close();
      }
    }
  }

  private async waitUntilWanted(decoded: DecodedFrame, anchorIndex: number): Promise<boolean> {
    while (!this.isDisposed) {
      if (this.mustRestart(decoded, anchorIndex)) {
        return false;
      }
      const window: LookaheadWindow | null = this.window();
      if (window !== null && decoded.presentationIndex <= window.endIndex) {
        return true;
      }
      await this.waitForChange(DecodingLookahead.IDLE_POLL_MILLISECONDS);
    }
    return false;
  }

  private mustRestart(decoded: DecodedFrame, anchorIndex: number): boolean {
    const window: LookaheadWindow | null = this.window();
    return (
      window === null ||
      window.playheadIndex < anchorIndex ||
      decoded.presentationIndex + DecodingLookahead.MAX_TRAILING_FRAMES < window.playheadIndex
    );
  }

  private encode(timeId: number, decoded: DecodedFrame): Promise<AnalysisRequest> {
    const { displayWidth: width, displayHeight: height }: VideoFrame = decoded.frame;
    const encoding: Promise<Blob> = FrameCapture.encode(decoded.frame, width, height, this.options.capture);
    decoded.frame.close();
    return encoding.then(async (blob: Blob) => ({
      timeId,
      frame: { bytes: await blob.arrayBuffer(), mimeType: blob.type, width, height },
    }));
  }

  private firstUncovered(window: LookaheadWindow): number | null {
    for (let index = window.firstUsefulIndex; index <= window.endIndex; index += 1) {
      const timeId: number | null = this.timeIdOf(index);
      if (timeId !== null && !this.options.scheduler.isCovered(timeId)) {
        return index;
      }
    }
    return null;
  }

  private window(): LookaheadWindow | null {
    const snapshot: PlayerSnapshot = this.options.controller.getSnapshot();
    const timeline: Timeline | null = snapshot.timeline;
    const mediaInfo: MediaInfo | null = snapshot.mediaInfo;
    if (timeline === null || mediaInfo === null || snapshot.timeId === null) {
      return null;
    }
    const frameTable: FrameTable = mediaInfo.frameTable;
    const playheadIndex: number = timeline.mediaIndexOf(snapshot.timeId);
    const rangeEndIndex: number = timeline.mediaIndexOf(timeline.clampToRange(timeline.rangeEndTimeId));
    const playheadSeconds: number = frameTable.timestampOf(playheadIndex);
    const endIndex: number = Math.min(frameTable.indexAt(playheadSeconds + this.options.leadSeconds), rangeEndIndex);
    const latencySeconds: number = (this.options.scheduler.getSnapshot().lastLatencyMilliseconds ?? 0) / 1000;
    const transitSeconds: number =
      snapshot.state === PlaybackState.PLAYING && !snapshot.isHeld
        ? latencySeconds * DecodingLookahead.LATENCY_MARGIN * snapshot.playbackRate
        : 0;
    const firstUsefulIndex: number = Math.min(frameTable.indexAt(playheadSeconds + transitSeconds), endIndex);
    return { playheadIndex, firstUsefulIndex, endIndex };
  }

  private timeIdOf(mediaIndex: number): number | null {
    const timeline: Timeline | null = this.options.controller.getSnapshot().timeline;
    if (timeline === null || mediaIndex >= timeline.frameCount) {
      return null;
    }
    const timeId: number = timeline.timeIdOf(mediaIndex);
    return timeId >= timeline.rangeStartTimeId && timeId <= timeline.rangeEndTimeId ? timeId : null;
  }

  private waitForChange(timeoutMilliseconds: number): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        this.wake = null;
        resolve();
      }, timeoutMilliseconds);
      this.wake = (): void => {
        clearTimeout(timer);
        resolve();
      };
    });
  }
}
