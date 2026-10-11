/**
 * How a video on another origin is requested, as the `crossorigin` attribute.
 *
 * Reading frames back, for frame copy, capture or analysis, and reading the
 * container's frame table both need the server to answer with CORS headers.
 */
export enum CrossOrigin {
  /** No CORS request for the video element: cross-origin videos play, but their frames cannot be read back. */
  NONE = "none",
  /** CORS request without credentials. */
  ANONYMOUS = "anonymous",
  /** CORS request with cookies and HTTP authentication. */
  USE_CREDENTIALS = "use-credentials",
}
