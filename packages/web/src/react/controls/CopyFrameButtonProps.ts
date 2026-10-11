import type { CopyNotice } from "./CopyNotice.js";

/**
 * Props of {@link CopyFrameButton}.
 */
export interface CopyFrameButtonProps {
  /** Accessible name and tooltip of the button. */
  readonly label: string;
  /** Text of the confirmation after a successful copy. */
  readonly copiedText: string;
  /** Text of the confirmation after a failed copy. */
  readonly failedText: string;
  /** Confirmation to show, or null. */
  readonly notice: CopyNotice | null;
  readonly onCopy: () => void;
  /** Called when the confirmation has faded out. */
  readonly onNoticeEnd: () => void;
}
