import type { AnnotationDocumentParser } from "@video-player-ui/annotations";

/**
 * Inputs of a {@link WebSocketFrameAnalyzer}.
 */
export interface WebSocketFrameAnalyzerOptions {
  /** Server address, such as `ws://localhost:8765`. */
  readonly url: string;
  /** Longest wait for one answer in milliseconds. Defaults to 10000. */
  readonly timeoutMilliseconds?: number;
  /** Parser of the returned annotations; register plugins here for custom kinds. */
  readonly parser?: AnnotationDocumentParser;
}
