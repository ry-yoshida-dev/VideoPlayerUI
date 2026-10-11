/**
 * Callbacks through which a playback engine reports to its controller.
 */
export interface PlaybackEngineEvents {
  /** A frame reached the screen; called once per displayed frame, including after seeks. */
  onFramePresented(presentationSeconds: number): void;
  /** Playback started or stopped, including for reasons outside the controller. */
  onPlayingChange(isPlaying: boolean): void;
  /** The media ran out of frames. */
  onEnded(): void;
  /** Decoding or playback failed. */
  onError(error: Error): void;
}
