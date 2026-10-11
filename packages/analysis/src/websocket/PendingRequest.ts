import type { Annotation } from "@video-player-ui/annotations";

/**
 * Request waiting for its answer from the analysis server.
 */
export interface PendingRequest {
  readonly resolve: (annotations: readonly Annotation[]) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}
