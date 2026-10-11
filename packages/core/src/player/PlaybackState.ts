/**
 * Lifecycle state of a player.
 */
export enum PlaybackState {
  /** Created; {@link PlayerController.load} not called yet. */
  IDLE = "idle",
  /** Reading the media's metadata and frame table. */
  LOADING = "loading",
  /** Loaded and showing a still frame. */
  PAUSED = "paused",
  /** Advancing through frames. */
  PLAYING = "playing",
  /** Stopped at the end of the range. */
  ENDED = "ended",
  /** Loading or playback failed; see the snapshot's error. */
  FAILED = "failed",
}
