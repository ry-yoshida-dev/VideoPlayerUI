/**
 * Accessible names of the controls, shown as tooltips; replace them to translate the UI.
 */
export interface PlayerLabels {
  readonly play: string;
  readonly pause: string;
  readonly skipBackward: (seconds: number) => string;
  readonly skipForward: (seconds: number) => string;
  readonly stepBackward: string;
  readonly stepForward: string;
  readonly copyFrame: string;
  readonly copied: string;
  readonly copyFailed: string;
  readonly mute: string;
  readonly unmute: string;
  readonly playbackRate: string;
  readonly loop: string;
  readonly enterFullscreen: string;
  readonly exitFullscreen: string;
  readonly seek: string;
  readonly timeId: string;
}
