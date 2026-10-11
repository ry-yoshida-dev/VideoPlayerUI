import type { ReactElement } from "react";
import { AnalysisState } from "@video-player-ui/analysis";

import type { AnalysisStatusChipProps } from "./AnalysisStatusChipProps.js";

/**
 * Compact status of live analysis: a dot for idle, analyzing or failed, the
 * latest round trip and, when the frame on screen has no result of its own,
 * how many time ids the shown result trails it. Hovering shows the details.
 *
 * @param props - Status, frame on screen and labels.
 * @returns The status element.
 */
export function AnalysisStatusChip({ status, displayedTimeId, sourceTimeIdAt, labels }: AnalysisStatusChipProps): ReactElement {
  const shownTimeId: number | null = displayedTimeId === null ? null : sourceTimeIdAt(displayedTimeId);
  const lag: number = displayedTimeId === null || shownTimeId === null ? 0 : displayedTimeId - shownTimeId;
  const isFailed: boolean = status.state === AnalysisState.FAILED;
  const isBehind: boolean = !isFailed && lag > 0;
  const latencyText: string = status.lastLatencyMilliseconds === null ? labels.pending : `${Math.round(status.lastLatencyMilliseconds)} ms`;
  const details: string[] = [labels.status];
  if (status.analyzedFrameCount === 0) {
    details.push(labels.waiting);
  } else if (isBehind && shownTimeId !== null) {
    details.push(labels.behind(lag, shownTimeId));
  } else if (shownTimeId !== null) {
    details.push(labels.inSync);
  }
  if (status.lastLatencyMilliseconds !== null) {
    details.push(labels.roundTrip(Math.round(status.lastLatencyMilliseconds)));
  }
  if (status.inFlightCount > 0) {
    details.push(labels.inFlight(status.inFlightCount));
  }
  details.push(labels.analyzedFrames(status.analyzedFrameCount));
  if (status.error !== null) {
    details.push(status.error.message);
  }
  return (
    <span
      className="vpui-analysis-status"
      data-state={status.state}
      data-vpui-tooltip={details.join("\n")}
      aria-label={details.join(". ")}
      role="status"
    >
      <span className="vpui-analysis-dot" aria-hidden="true" />
      <span>{isFailed ? labels.failed : latencyText}</span>
      {isBehind && <span className="vpui-analysis-lag">{`−${lag}`}</span>}
    </span>
  );
}
