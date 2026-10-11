import type { TimelineParameters } from "../timeline/TimelineParameters.js";
import type { TimelineParametersInit } from "../timeline/TimelineParametersInit.js";
import type { PlaybackEngine } from "./PlaybackEngine.js";

/**
 * Inputs of a {@link PlayerController}.
 */
export interface PlayerControllerOptions {
  /** Platform engine decoding the media. */
  readonly engine: PlaybackEngine;
  /** Sampling parameters of the timeline. Defaults to every frame, time ids from 1. */
  readonly timeline?: TimelineParameters | TimelineParametersInit;
  /** Initial speed multiplier. Defaults to 1. */
  readonly playbackRate?: number;
  /** Whether playback restarts at the range end. Defaults to false. */
  readonly isLooping?: boolean;
  /** Whether audio starts muted. Defaults to false. */
  readonly isMuted?: boolean;
}
