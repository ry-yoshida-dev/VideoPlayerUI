import type { MediaInfo } from "./MediaInfo.js";
import type { PlaybackEngineEvents } from "./PlaybackEngineEvents.js";
import type { PlayOutcome } from "./PlayOutcome.js";

/**
 * Platform decoder and clock driven by a {@link PlayerController}.
 *
 * Each platform implements it over its native media stack, so the controller
 * and the overlay never touch platform APIs. Swapping the engine is also how
 * a player reads local files, HTTP streams or frames served by a backend.
 */
export interface PlaybackEngine {
  /**
   * Open the media and start reporting events.
   *
   * @param events - Callbacks for frames, play state, end and errors.
   * @returns The frame size and frame table.
   */
  load(events: PlaybackEngineEvents): Promise<MediaInfo>;
  /**
   * Start or resume playback.
   *
   * @returns Whether playback started or a pause interrupted the request;
   *   rejects only when playback cannot start.
   */
  play(): Promise<PlayOutcome>;
  /** Stop playback on the current frame. */
  pause(): void;
  /**
   * Display the frame at a presentation time.
   *
   * @param presentationSeconds - Seek position in seconds.
   */
  seek(presentationSeconds: number): Promise<void>;
  /** Set the speed multiplier; 1 is real time. */
  setPlaybackRate(rate: number): void;
  /** Silence or restore the audio track. */
  setMuted(isMuted: boolean): void;
  /** Release the decoder and every platform resource. */
  dispose(): void;
}
