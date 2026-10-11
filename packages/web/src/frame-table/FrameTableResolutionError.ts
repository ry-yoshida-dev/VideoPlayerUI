/**
 * Raised when a resolver cannot produce a frame table for a video.
 */
export class FrameTableResolutionError extends Error {
  /**
   * Describe why the frame table is unavailable.
   *
   * @param message - The reason.
   * @param options - The underlying error, if any.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FrameTableResolutionError";
  }
}
