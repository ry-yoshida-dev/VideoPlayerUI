import type { ReactElement } from "react";

import { Icon } from "../icons/Icon.js";
import { IconName } from "../icons/IconName.js";
import type { CopyFrameButtonProps } from "./CopyFrameButtonProps.js";
import { CopyStatus } from "./CopyStatus.js";
import { IconButton } from "./IconButton.js";

/**
 * Frame copy button that confirms each copy with a short bubble above it,
 * whether the copy came from the button or the keyboard.
 *
 * @param props - Labels, current confirmation and callbacks.
 * @returns The button with its confirmation bubble.
 */
export function CopyFrameButton({ label, copiedText, failedText, notice, onCopy, onNoticeEnd }: CopyFrameButtonProps): ReactElement {
  const isSucceeded: boolean = notice?.status === CopyStatus.SUCCEEDED;
  return (
    <span className="vpui-popover-anchor">
      <IconButton label={label} onClick={onCopy}>
        <Icon name={isSucceeded ? IconName.CHECK : IconName.COPY} size={20} />
      </IconButton>
      {notice !== null && (
        <span key={notice.serial} className="vpui-toast" role="status" data-status={notice.status} onAnimationEnd={onNoticeEnd}>
          {isSucceeded ? copiedText : failedText}
        </span>
      )}
    </span>
  );
}
