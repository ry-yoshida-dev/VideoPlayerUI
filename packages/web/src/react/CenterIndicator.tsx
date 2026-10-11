import type { ReactElement } from "react";
import { PlaybackState } from "@video-player-ui/core";

import type { CenterIndicatorProps } from "./CenterIndicatorProps.js";
import { Icon } from "./icons/Icon.js";
import { IconName } from "./icons/IconName.js";

/**
 * Glyph in the middle of the video: a spinner while loading, a warning on
 * failure, and a brief echo of commands. Nothing stays over a loaded frame,
 * so the picture is never covered while it is inspected.
 *
 * @param props - State and feedback.
 * @returns The indicator, or null when nothing applies.
 */
export function CenterIndicator({ snapshot, feedback, onFeedbackEnd }: CenterIndicatorProps): ReactElement | null {
  if (snapshot === null || snapshot.state === PlaybackState.IDLE || snapshot.state === PlaybackState.LOADING) {
    return (
      <div className="vpui-center">
        <div className="vpui-spinner" role="progressbar" />
      </div>
    );
  }
  if (snapshot.state === PlaybackState.FAILED) {
    return (
      <div className="vpui-center vpui-error" title={snapshot.error?.message} role="alert">
        <Icon name={IconName.WARNING} size={48} />
      </div>
    );
  }
  if (feedback === null) {
    return null;
  }
  return (
    <div className="vpui-center" aria-hidden="true">
      <div className="vpui-feedback" key={feedback.serial} onAnimationEnd={onFeedbackEnd}>
        {feedback.content}
      </div>
    </div>
  );
}
