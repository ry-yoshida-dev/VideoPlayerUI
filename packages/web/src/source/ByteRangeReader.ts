import type { VideoSource } from "./VideoSource.js";

/**
 * Reads byte ranges of a video source: slices of in-memory files, or HTTP
 * range requests with a whole-file fallback for servers without range support.
 */
export class ByteRangeReader {
  private readonly source: VideoSource;
  private wholeFile: Promise<ArrayBuffer> | null = null;

  /**
   * Bind the reader to a source.
   *
   * @param source - URL or in-memory file.
   */
  constructor(source: VideoSource) {
    this.source = source;
  }

  /**
   * Read a range of bytes.
   *
   * @param offset - First byte.
   * @param length - Number of bytes.
   * @returns The bytes.
   * @throws Error When a URL answers with an error status.
   */
  async read(offset: number, length: number): Promise<Uint8Array<ArrayBuffer>> {
    if (typeof this.source !== "string") {
      return new Uint8Array(await this.source.slice(offset, offset + length).arrayBuffer());
    }
    if (this.wholeFile !== null) {
      return new Uint8Array((await this.wholeFile).slice(offset, offset + length));
    }
    const response: Response = await fetch(this.source, { headers: { Range: `bytes=${offset}-${offset + length - 1}` } });
    if (response.status === 206) {
      return new Uint8Array(await response.arrayBuffer());
    }
    if (!response.ok) {
      throw new Error(`Failed to read ${this.source}: HTTP ${response.status}`);
    }
    this.wholeFile = response.arrayBuffer();
    return new Uint8Array((await this.wholeFile).slice(offset, offset + length));
  }
}
