import { CrossOrigin } from "./CrossOrigin.js";
import type { VideoSource } from "./VideoSource.js";

/**
 * Reads byte ranges of a video source: slices of in-memory files, or HTTP
 * range requests with a whole-file fallback for servers without range support.
 */
export class ByteRangeReader {
  private static readonly RANGE_NOT_SATISFIABLE: number = 416;

  private readonly source: VideoSource;
  private readonly crossOrigin: CrossOrigin;
  private wholeFile: Promise<ArrayBuffer> | null = null;

  /**
   * Bind the reader to a source.
   *
   * @param source - URL or in-memory file.
   * @param crossOrigin - Whether URL requests send credentials; matches the video element's setting.
   */
  constructor(source: VideoSource, crossOrigin: CrossOrigin = CrossOrigin.NONE) {
    this.source = source;
    this.crossOrigin = crossOrigin;
  }

  /**
   * Read a range of bytes.
   *
   * @param offset - First byte.
   * @param length - Number of bytes.
   * @returns The bytes; shorter than `length` at the end of the source, and empty past it.
   * @throws Error When a URL cannot be fetched or answers with an error status.
   */
  async read(offset: number, length: number): Promise<Uint8Array<ArrayBuffer>> {
    if (typeof this.source !== "string") {
      return new Uint8Array(await this.source.slice(offset, offset + length).arrayBuffer());
    }
    if (this.wholeFile !== null) {
      return new Uint8Array((await this.wholeFile).slice(offset, offset + length));
    }
    const response: Response = await this.request(this.source, { Range: `bytes=${offset}-${offset + length - 1}` });
    if (response.status === 206) {
      return new Uint8Array(await response.arrayBuffer());
    }
    if (response.status === ByteRangeReader.RANGE_NOT_SATISFIABLE) {
      return new Uint8Array(0);
    }
    if (!response.ok) {
      throw new Error(`Failed to read ${this.source}: HTTP ${response.status}`);
    }
    this.wholeFile = response.arrayBuffer();
    return new Uint8Array((await this.wholeFile).slice(offset, offset + length));
  }

  private async request(url: string, headers: Record<string, string>): Promise<Response> {
    const credentials: RequestCredentials = this.crossOrigin === CrossOrigin.USE_CREDENTIALS ? "include" : "same-origin";
    try {
      return await fetch(url, { headers, credentials });
    } catch (error: unknown) {
      throw new Error(`Failed to fetch ${url}; a URL on another origin needs CORS headers (Access-Control-Allow-Origin) on its server`, {
        cause: error,
      });
    }
  }
}
