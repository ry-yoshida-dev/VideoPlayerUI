/**
 * How a {@link PlaybackEngine.play} request settled.
 */
export enum PlayOutcome {
  /** Playback started. */
  STARTED = "started",
  /** A pause or a new load stopped the request before playback started. */
  INTERRUPTED = "interrupted",
}
