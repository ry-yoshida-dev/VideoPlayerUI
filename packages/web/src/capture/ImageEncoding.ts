/**
 * Image formats a frame can be encoded in.
 */
export enum ImageEncoding {
  /** Lossless; the default for inspection. */
  PNG = "image/png",
  /** Lossy and smaller, for faster transfer. */
  JPEG = "image/jpeg",
  /** Lossy or lossless depending on quality, smaller than PNG. */
  WEBP = "image/webp",
}
