import type { AnalysisStatus } from "@video-player-ui/analysis";

import type { LiveAnalysisLabels } from "./LiveAnalysisLabels.js";

/**
 * Props of {@link AnalysisStatusChip}.
 */
export interface AnalysisStatusChipProps {
  readonly status: AnalysisStatus;
  /** Time id of the frame on screen, or null. */
  readonly displayedTimeId: number | null;
  /** Time id whose result is shown for a frame, or null when none is. */
  readonly sourceTimeIdAt: (timeId: number) => number | null;
  readonly labels: LiveAnalysisLabels;
}
