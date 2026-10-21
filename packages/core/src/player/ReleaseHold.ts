/**
 * Ends the hold a {@link PlayerController.hold} call placed; playback
 * continues once every hold is released. Calling it again does nothing.
 */
export type ReleaseHold = () => Promise<void>;
