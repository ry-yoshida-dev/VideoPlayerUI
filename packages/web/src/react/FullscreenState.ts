/**
 * Result of {@link useFullscreen}.
 */
export interface FullscreenState {
  /** Whether the browser lets elements go full screen. */
  readonly isSupported: boolean;
  /** Whether the element is full screen now. */
  readonly isFullscreen: boolean;
  /** Enter or leave full screen. */
  readonly toggle: () => void;
}
