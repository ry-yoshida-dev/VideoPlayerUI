import type { LiveAnalysisLabels } from "./LiveAnalysisLabels.js";

/**
 * English texts used when an application supplies none.
 */
export const defaultLiveAnalysisLabels: LiveAnalysisLabels = {
  status: "Live analysis",
  inSync: "Result matches the frame on screen",
  behind: (frames: number, shownTimeId: number): string => `Showing the result of #${shownTimeId}, ${frames} frames behind`,
  waiting: "Waiting for the first result",
  roundTrip: (milliseconds: number): string => `Round trip ${milliseconds} ms per frame`,
  inFlight: (count: number): string => `${count} frames being analyzed`,
  analyzedFrames: (count: number): string => `${count} frames analyzed`,
  pending: "waiting",
  failed: "error",
};
