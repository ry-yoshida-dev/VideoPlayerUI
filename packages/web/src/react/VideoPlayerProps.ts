import type { CSSProperties, ReactNode, Ref } from "react";
import type { ContentFit, PlayerController, PresentedFrame } from "@video-player-ui/core";

import type { KeyboardShortcuts } from "./KeyboardShortcuts.js";
import type { HtmlVideoPlayerOptions } from "./HtmlVideoPlayerOptions.js";
import type { PlayerLabels } from "./PlayerLabels.js";

/**
 * Props of {@link VideoPlayer}.
 *
 * `playbackRate`, `isMuted` and `isLooping` set the initial values and, when
 * they change, push the new value to the player; the built-in controls can
 * still change them in between.
 */
export interface VideoPlayerProps extends HtmlVideoPlayerOptions {
  /** Receives the player's controller once it exists, and null after it is disposed. */
  readonly ref?: Ref<PlayerController | null>;
  /** How the video fills the player. Defaults to {@link ContentFit.CONTAIN}. */
  readonly contentFit?: ContentFit;
  /** Whether the built-in controls are shown. Defaults to true. */
  readonly isControlsVisible?: boolean;
  /** Whether the editable time id field is shown. Defaults to true. */
  readonly isTimeIdVisible?: boolean;
  /** Speeds offered by the speed menu. */
  readonly playbackRates?: readonly number[];
  /** Seconds the back button skips. Defaults to 10. */
  readonly skipBackwardSeconds?: number;
  /** Seconds the forward button skips. Defaults to 30. */
  readonly skipForwardSeconds?: number;
  /** Tooltips and accessible names; replace to translate. */
  readonly labels?: Partial<PlayerLabels>;
  /** Keyboard bindings, or null to disable keyboard control. */
  readonly keyboardShortcuts?: KeyboardShortcuts | null;
  /** Called for every frame that reaches the screen. */
  readonly onFrame?: (frame: PresentedFrame) => void;
  /** Called when loading or playback fails. */
  readonly onError?: (error: Error) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
  /**
   * Extensions rendered over the video once the player exists, such as a
   * {@link FrameCanvas} or `AnnotationLayer`; they reach the player through
   * {@link usePlayerContext} and add controls with {@link PlayerControlSlot}.
   */
  readonly children?: ReactNode;
}
