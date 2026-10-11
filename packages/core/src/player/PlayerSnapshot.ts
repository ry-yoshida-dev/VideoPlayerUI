import type { Timeline } from "../timeline/Timeline.js";
import type { MediaInfo } from "./MediaInfo.js";
import type { PlaybackState } from "./PlaybackState.js";

/**
 * Immutable view of a player's state; a new object is published on every change.
 */
export interface PlayerSnapshot {
  readonly state: PlaybackState;
  /** Timeline of the loaded media, or null before loading. */
  readonly timeline: Timeline | null;
  /** Metadata of the loaded media, or null before loading. */
  readonly mediaInfo: MediaInfo | null;
  /** Time id of the frame on screen, or the target of a pending seek; null before loading. */
  readonly timeId: number | null;
  /** Presentation timestamp matching `timeId`, in seconds. */
  readonly presentationSeconds: number;
  /** Presentation timestamp of the range's first frame, in seconds. */
  readonly rangeStartSeconds: number;
  /** End of the range's last frame, in seconds. */
  readonly rangeEndSeconds: number;
  /** Speed multiplier; 1 is real time. */
  readonly playbackRate: number;
  readonly isMuted: boolean;
  /** Whether playback restarts from the range start at the range end. */
  readonly isLooping: boolean;
  /** Failure that moved the player to the failed state, or null. */
  readonly error: Error | null;
}
