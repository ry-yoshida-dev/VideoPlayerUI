import type { Annotation } from "@video-player-ui/annotations";

import type { ResponseKind } from "./ResponseKind.js";

/**
 * Successful answer to one request.
 */
export interface AnalysisResult {
  readonly kind: ResponseKind.RESULT;
  readonly requestId: number;
  readonly timeId: number;
  /** Annotations in normalized frame coordinates. */
  readonly annotations: readonly Annotation[];
}
