import type { ResponseKind } from "./ResponseKind.js";

/**
 * Failed answer to one request.
 */
export interface AnalysisFailure {
  readonly kind: ResponseKind.ERROR;
  readonly requestId: number;
  readonly message: string;
}
