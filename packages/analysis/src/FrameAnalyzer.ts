import type { Annotation } from "@video-player-ui/annotations";

import type { AnalysisRequest } from "./AnalysisRequest.js";

/**
 * Turns frames into annotations, locally or on a server.
 */
export interface FrameAnalyzer {
  /**
   * Analyze one frame.
   *
   * @param request - The frame and its time id.
   * @returns The annotations of the frame, in normalized frame coordinates.
   */
  analyze(request: AnalysisRequest): Promise<readonly Annotation[]>;
  /** Close connections; a later {@link FrameAnalyzer.analyze} opens them again. */
  close(): void;
}
