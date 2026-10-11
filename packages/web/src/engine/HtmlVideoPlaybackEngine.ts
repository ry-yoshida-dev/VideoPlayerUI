import type { FrameTable, MediaInfo, PlaybackEngine, PlaybackEngineEvents } from "@video-player-ui/core";

import type { FrameTableResolver } from "../frame-table/FrameTableResolver.js";
import type { VideoSource } from "../source/VideoSource.js";
import type { HtmlVideoPlaybackEngineOptions } from "./HtmlVideoPlaybackEngineOptions.js";

/**
 * Playback engine over an `HTMLVideoElement`.
 *
 * The browser decodes with its hardware decoders; frames on screen are
 * reported through `requestVideoFrameCallback`, falling back to polling the
 * clock once per animation frame where it is missing.
 */
export class HtmlVideoPlaybackEngine implements PlaybackEngine {
  private readonly video: HTMLVideoElement;
  private readonly source: VideoSource;
  private readonly frameTableResolver: FrameTableResolver;
  private readonly abortController: AbortController = new AbortController();
  private events: PlaybackEngineEvents | null = null;
  private objectUrl: string | null = null;
  private frameCallbackHandle: number | null = null;
  private animationFrameHandle: number | null = null;
  private lastPolledSeconds: number = Number.NaN;

  /**
   * Bind the engine to its element and source.
   *
   * @param options - Element, source and frame table resolver.
   */
  constructor(options: HtmlVideoPlaybackEngineOptions) {
    this.video = options.video;
    this.source = options.source;
    this.frameTableResolver = options.frameTableResolver;
  }

  async load(events: PlaybackEngineEvents): Promise<MediaInfo> {
    this.events = events;
    this.listen();
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.src = this.resolveUrl();
    await this.waitFor("loadedmetadata");
    const frameTable: FrameTable = await this.frameTableResolver.resolve({
      source: this.source,
      durationSeconds: this.video.duration,
    });
    this.watchFrames();
    return {
      frameSize: { width: this.video.videoWidth, height: this.video.videoHeight },
      frameTable,
    };
  }

  async play(): Promise<void> {
    await this.video.play();
  }

  pause(): void {
    this.video.pause();
  }

  async seek(presentationSeconds: number): Promise<void> {
    const seeked: Promise<void> = this.waitFor("seeked");
    this.video.currentTime = presentationSeconds;
    await seeked;
  }

  setPlaybackRate(rate: number): void {
    this.video.playbackRate = rate;
  }

  setMuted(isMuted: boolean): void {
    this.video.muted = isMuted;
  }

  dispose(): void {
    this.abortController.abort();
    if (this.frameCallbackHandle !== null) {
      this.video.cancelVideoFrameCallback(this.frameCallbackHandle);
    }
    if (this.animationFrameHandle !== null) {
      cancelAnimationFrame(this.animationFrameHandle);
    }
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    if (this.objectUrl !== null) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.events = null;
  }

  private resolveUrl(): string {
    if (typeof this.source === "string") {
      return this.source;
    }
    this.objectUrl = URL.createObjectURL(this.source);
    return this.objectUrl;
  }

  private listen(): void {
    const options: AddEventListenerOptions = { signal: this.abortController.signal };
    this.video.addEventListener("playing", () => this.events?.onPlayingChange(true), options);
    this.video.addEventListener(
      "pause",
      () => {
        if (!this.video.ended) {
          this.events?.onPlayingChange(false);
        }
      },
      options,
    );
    this.video.addEventListener("ended", () => this.events?.onEnded(), options);
    this.video.addEventListener("seeked", () => this.events?.onFramePresented(this.video.currentTime), options);
    this.video.addEventListener("error", () => this.events?.onError(this.describeError()), options);
  }

  private watchFrames(): void {
    if (typeof this.video.requestVideoFrameCallback === "function") {
      const onFrame: VideoFrameRequestCallback = (_now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata): void => {
        this.events?.onFramePresented(metadata.mediaTime);
        this.frameCallbackHandle = this.video.requestVideoFrameCallback(onFrame);
      };
      this.frameCallbackHandle = this.video.requestVideoFrameCallback(onFrame);
      return;
    }
    const poll: FrameRequestCallback = (): void => {
      const seconds: number = this.video.currentTime;
      if (seconds !== this.lastPolledSeconds) {
        this.lastPolledSeconds = seconds;
        this.events?.onFramePresented(seconds);
      }
      this.animationFrameHandle = requestAnimationFrame(poll);
    };
    this.animationFrameHandle = requestAnimationFrame(poll);
  }

  private waitFor(eventName: "loadedmetadata" | "seeked"): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
      const cleanup: AbortController = new AbortController();
      const options: AddEventListenerOptions = { signal: AbortSignal.any([cleanup.signal, this.abortController.signal]) };
      this.video.addEventListener(
        eventName,
        () => {
          cleanup.abort();
          resolve();
        },
        options,
      );
      this.video.addEventListener(
        "error",
        () => {
          cleanup.abort();
          reject(this.describeError());
        },
        options,
      );
    });
  }

  private describeError(): Error {
    const mediaError: MediaError | null = this.video.error;
    return new Error(mediaError === null ? "The video failed to play" : `Video error ${mediaError.code}: ${mediaError.message}`);
  }
}
