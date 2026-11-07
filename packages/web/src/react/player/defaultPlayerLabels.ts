import type { PlayerLabels } from "./PlayerLabels.js";

/**
 * English control names used when an application supplies none.
 */
export const defaultPlayerLabels: PlayerLabels = {
  play: "Play (Space)",
  pause: "Pause (Space)",
  skipBackward: (seconds: number): string => `Back ${seconds} s (←)`,
  skipForward: (seconds: number): string => `Forward ${seconds} s (→)`,
  stepBackward: "Previous frame (,)",
  stepForward: "Next frame (.)",
  copyFrame: "Copy frame (C)",
  copied: "Copied",
  copyFailed: "Copy failed",
  mute: "Mute (M)",
  unmute: "Unmute (M)",
  playbackRate: "Playback speed",
  loop: "Loop",
  enterFullscreen: "Full screen (F)",
  exitFullscreen: "Exit full screen (F)",
  seek: "Seek",
  timeId: "Time id: type an id or m:ss.sss, then Enter (G)",
};
