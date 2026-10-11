/**
 * Raised when the analysis server is unreachable, times out or reports a failure.
 */
export class AnalysisServerError extends Error {
  /**
   * Describe the failure.
   *
   * @param message - What went wrong.
   */
  constructor(message: string) {
    super(message);
    this.name = "AnalysisServerError";
  }
}
