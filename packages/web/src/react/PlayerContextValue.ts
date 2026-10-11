import type { ReactNode } from "react";
import type { ContentFit, PlayerController, Unsubscribe } from "@video-player-ui/core";

import type { CapturedFrame } from "../capture/CapturedFrame.js";
import type { FrameCaptureOptions } from "../capture/FrameCaptureOptions.js";
import type { CrossOrigin } from "../source/CrossOrigin.js";
import type { VideoSource } from "../source/VideoSource.js";

/**
 * What a {@link VideoPlayer} offers to the extensions rendered inside it.
 */
export interface PlayerContextValue {
  /** The player's controller. */
  readonly controller: PlayerController;
  /** Video being played, for extensions that decode it themselves, such as look-ahead analysis. */
  readonly source: VideoSource;
  /** How the source is requested; extensions reading it themselves must send the same credentials. */
  readonly crossOrigin: CrossOrigin;
  /** How the video is fitted into the player; overlays must use the same fit. */
  readonly contentFit: ContentFit;
  /** Element of the control bar that {@link PlayerControlSlot} renders into, or null while the bar is hidden. */
  readonly controlSlot: HTMLElement | null;
  /** Flash a glyph in the middle of the player, as the built-in commands do. */
  readonly showFeedback: (content: ReactNode) => void;
  /** Encode the frame on screen at the video's resolution; PNG unless options say otherwise. */
  readonly captureFrame: (options?: FrameCaptureOptions) => Promise<Blob>;
  /**
   * Encode the frame on screen together with its time id, guaranteeing the
   * two match: during playback or a seek the capture waits for the next
   * presented frame, otherwise it takes the frame on screen. Rejects when the
   * player fails or is disposed first.
   */
  readonly capturePresentedFrame: (options?: FrameCaptureOptions) => Promise<CapturedFrame>;
  /** Bind a key, as `KeyboardEvent.key` with letters in lower case, to a command. */
  readonly registerShortcut: (key: string, handler: () => void) => Unsubscribe;
}
