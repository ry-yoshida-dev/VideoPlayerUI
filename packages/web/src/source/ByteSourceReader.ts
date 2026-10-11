import type { ByteChunk } from "./ByteChunk.js";
import type { VideoSource } from "./VideoSource.js";

/**
 * Reads a video source front to back in chunks, stopping early when the
 * consumer stops iterating.
 */
export class ByteSourceReader {
  /** Bytes per chunk read from in-memory sources. */
  static readonly BLOB_CHUNK_BYTES: number = 4 * 1024 * 1024;

  private readonly source: VideoSource;

  /**
   * Bind the reader to a source.
   *
   * @param source - URL or in-memory file.
   */
  constructor(source: VideoSource) {
    this.source = source;
  }

  /**
   * Iterate the source's bytes in order.
   *
   * @returns The chunks; breaking out of the loop cancels any download.
   * @throws Error When a URL responds with an error status or no body.
   */
  async *chunks(): AsyncGenerator<ByteChunk, void, undefined> {
    if (typeof this.source === "string") {
      yield* ByteSourceReader.readUrl(this.source);
      return;
    }
    yield* ByteSourceReader.readBlob(this.source);
  }

  private static async *readBlob(blob: Blob): AsyncGenerator<ByteChunk, void, undefined> {
    for (let offset = 0; offset < blob.size; offset += ByteSourceReader.BLOB_CHUNK_BYTES) {
      const bytes: ArrayBuffer = await blob.slice(offset, offset + ByteSourceReader.BLOB_CHUNK_BYTES).arrayBuffer();
      yield { bytes, offset };
    }
  }

  private static async *readUrl(url: string): AsyncGenerator<ByteChunk, void, undefined> {
    const abortController: AbortController = new AbortController();
    const response: Response = await fetch(url, { signal: abortController.signal });
    if (!response.ok || response.body === null) {
      throw new Error(`Failed to read ${url}: HTTP ${response.status}`);
    }
    const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();
    let offset: number = 0;
    try {
      while (true) {
        const result: ReadableStreamReadResult<Uint8Array> = await reader.read();
        if (result.done) {
          return;
        }
        const bytes: ArrayBuffer = result.value.slice().buffer;
        yield { bytes, offset };
        offset += bytes.byteLength;
      }
    } finally {
      abortController.abort();
      reader.releaseLock();
    }
  }
}
