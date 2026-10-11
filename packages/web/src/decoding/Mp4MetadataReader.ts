import { createFile, MP4BoxBuffer } from "mp4box";
import type { ISOFile, Movie } from "mp4box";

import { FrameTableResolutionError } from "../frame-table/FrameTableResolutionError.js";
import type { ByteRangeReader } from "../source/ByteRangeReader.js";
import type { Mp4BoxHeader } from "./Mp4BoxHeader.js";
import type { Mp4Metadata } from "./Mp4Metadata.js";

/**
 * Parses the structure of an MP4 or MOV file without downloading its media.
 *
 * Top-level boxes are walked by range reads and only the media data is
 * skipped, so a movie header at the end of the file costs no more than one in
 * front. Fragmented files are walked to their end to collect every fragment's
 * samples, which over HTTP costs one request per fragment.
 */
export class Mp4MetadataReader {
  /** Bytes read beyond each requested range, so neighbouring small boxes need no request of their own. */
  static readonly READ_AHEAD_BYTES: number = 32 * 1024;

  private static readonly HEADER_BYTES: number = 8;
  private static readonly LARGE_HEADER_BYTES: number = 16;
  private static readonly MEDIA_DATA_TYPE: string = "mdat";
  private static readonly PRINTABLE_FOURCC: RegExp = /^[\x20-\x7e]{4}$/;

  private readonly reader: ByteRangeReader;
  private windowOffset: number = 0;
  private windowBytes: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  /**
   * Bind the parser to the bytes of a file.
   *
   * @param reader - Reader of the file.
   */
  constructor(reader: ByteRangeReader) {
    this.reader = reader;
  }

  /**
   * Parse the movie header and, in fragmented files, every movie fragment header.
   *
   * @returns The parsed structure.
   * @throws FrameTableResolutionError When the file cannot be read or is not MP4.
   */
  async read(): Promise<Mp4Metadata> {
    const file: ISOFile = createFile();
    const parsed: { movie: Movie | null; error: string | null } = { movie: null, error: null };
    file.onReady = (info: Movie): void => {
      parsed.movie = info;
    };
    file.onError = (module: string, message: string): void => {
      parsed.error = `${module}: ${message}`;
    };
    try {
      await this.walk(file, parsed);
    } catch (error: unknown) {
      if (error instanceof FrameTableResolutionError) {
        throw error;
      }
      const reason: string = error instanceof Error ? error.message : String(error);
      throw new FrameTableResolutionError(`The file could not be read as MP4: ${reason}`, { cause: error });
    }
    file.flush();
    if (parsed.movie === null) {
      throw new FrameTableResolutionError(parsed.error ?? "The file has no MP4 movie header");
    }
    return { file, movie: parsed.movie };
  }

  private async walk(file: ISOFile, parsed: { readonly movie: Movie | null; readonly error: string | null }): Promise<void> {
    let offset: number = 0;
    while (true) {
      const header: Mp4BoxHeader | null = await this.readHeader(offset);
      if (header === null) {
        return;
      }
      if (header.boxBytes === null && !header.isMediaData) {
        throw new FrameTableResolutionError(`The box at byte ${offset} extends to the end of the file, which only media data may do`);
      }
      const appendedBytes: number = header.isMediaData ? header.headerBytes : (header.boxBytes ?? header.headerBytes);
      const bytes: Uint8Array<ArrayBuffer> = await this.bytesAt(offset, appendedBytes);
      file.appendBuffer(MP4BoxBuffer.fromArrayBuffer(bytes.slice().buffer, offset));
      if (parsed.error !== null || (parsed.movie !== null && !parsed.movie.isFragmented)) {
        return;
      }
      if (header.boxBytes === null || bytes.length < appendedBytes) {
        return;
      }
      offset += header.boxBytes;
    }
  }

  private async readHeader(offset: number): Promise<Mp4BoxHeader | null> {
    const bytes: Uint8Array<ArrayBuffer> = await this.bytesAt(offset, Mp4MetadataReader.LARGE_HEADER_BYTES);
    if (bytes.length < Mp4MetadataReader.HEADER_BYTES) {
      return null;
    }
    const view: DataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const type: string = String.fromCharCode(...bytes.subarray(4, Mp4MetadataReader.HEADER_BYTES));
    if (!Mp4MetadataReader.PRINTABLE_FOURCC.test(type)) {
      throw new FrameTableResolutionError(`The bytes at ${offset} are not an MP4 box`);
    }
    const isMediaData: boolean = type === Mp4MetadataReader.MEDIA_DATA_TYPE;
    const compactSize: number = view.getUint32(0);
    if (compactSize === 0) {
      return { isMediaData, headerBytes: Mp4MetadataReader.HEADER_BYTES, boxBytes: null };
    }
    if (compactSize !== 1) {
      return Mp4MetadataReader.validated(offset, { isMediaData, headerBytes: Mp4MetadataReader.HEADER_BYTES, boxBytes: compactSize });
    }
    if (bytes.length < Mp4MetadataReader.LARGE_HEADER_BYTES) {
      return null;
    }
    const largeSize: number = Number(view.getBigUint64(Mp4MetadataReader.HEADER_BYTES));
    return Mp4MetadataReader.validated(offset, { isMediaData, headerBytes: Mp4MetadataReader.LARGE_HEADER_BYTES, boxBytes: largeSize });
  }

  private async bytesAt(offset: number, length: number): Promise<Uint8Array<ArrayBuffer>> {
    const windowEnd: number = this.windowOffset + this.windowBytes.length;
    const isWindowed: boolean = offset >= this.windowOffset && offset + length <= windowEnd;
    if (!isWindowed) {
      this.windowOffset = offset;
      this.windowBytes = await this.reader.read(offset, Math.max(length, Mp4MetadataReader.READ_AHEAD_BYTES));
    }
    const start: number = offset - this.windowOffset;
    return this.windowBytes.subarray(start, start + length);
  }

  private static validated(offset: number, header: Mp4BoxHeader): Mp4BoxHeader {
    if (header.boxBytes !== null && (!Number.isSafeInteger(header.boxBytes) || header.boxBytes < header.headerBytes)) {
      throw new FrameTableResolutionError(`The box at byte ${offset} declares an invalid size of ${header.boxBytes} bytes`);
    }
    return header;
  }
}
