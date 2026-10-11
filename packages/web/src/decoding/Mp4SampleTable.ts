import { FrameTable } from "@video-player-ui/core";
import { MultiBufferStream, VisualSampleEntry } from "mp4box";
import type { ISOFile, Movie, Sample, SampleEntry, Track } from "mp4box";

import { FrameTableResolutionError } from "../frame-table/FrameTableResolutionError.js";
import type { ByteRangeReader } from "../source/ByteRangeReader.js";
import type { Mp4Metadata } from "./Mp4Metadata.js";
import { Mp4MetadataReader } from "./Mp4MetadataReader.js";
import type { Mp4Sample } from "./Mp4Sample.js";

/**
 * Sample table of the first video track of an MP4 or MOV file, fragmented or
 * not: what to feed a decoder, in which order, and which stored frame each
 * sample shows.
 *
 * Presentation times apply the edit list the way browsers and FFmpeg do, so
 * stored frame indices match the player's frame table and TimeSeriesIterator.
 */
export class Mp4SampleTable {
  /** Samples in decode order. */
  readonly samplesInDecodeOrder: readonly Mp4Sample[];
  /** Visible samples in presentation order; position equals the stored frame index. */
  readonly samplesInPresentationOrder: readonly Mp4Sample[];
  /** Configuration for a WebCodecs `VideoDecoder`. */
  readonly decoderConfig: VideoDecoderConfig;
  /** End of the last frame's display interval, in seconds. */
  readonly endSeconds: number;

  private constructor(samplesInDecodeOrder: readonly Mp4Sample[], decoderConfig: VideoDecoderConfig, endSeconds: number) {
    this.samplesInDecodeOrder = samplesInDecodeOrder;
    this.samplesInPresentationOrder = samplesInDecodeOrder
      .filter((sample: Mp4Sample) => sample.presentationIndex !== null)
      .sort((left: Mp4Sample, right: Mp4Sample) => left.timestampMicroseconds - right.timestampMicroseconds);
    this.decoderConfig = decoderConfig;
    this.endSeconds = endSeconds;
  }

  /**
   * Read the sample table, skipping the media data.
   *
   * @param reader - Reader of the file; sharing it with a
   *   {@link SequentialFrameDecoder} downloads a file from a server without
   *   range support only once.
   * @returns The sample table.
   * @throws FrameTableResolutionError When the file is not MP4, has no video track or lists no samples.
   */
  static async read(reader: ByteRangeReader): Promise<Mp4SampleTable> {
    const metadata: Mp4Metadata = await new Mp4MetadataReader(reader).read();
    return Mp4SampleTable.fromParsedFile(metadata.file, metadata.movie);
  }

  /**
   * Frame table of the visible samples.
   *
   * @returns The frame table.
   * @throws FrameTableResolutionError When the timestamps are malformed.
   */
  toFrameTable(): FrameTable {
    try {
      return FrameTable.fromTimestamps(
        this.samplesInPresentationOrder.map((sample: Mp4Sample) => sample.timestampMicroseconds / 1e6),
        this.endSeconds,
      );
    } catch (error: unknown) {
      throw new FrameTableResolutionError("The sample table is malformed", { cause: error });
    }
  }

  private static fromParsedFile(file: ISOFile, movie: Movie): Mp4SampleTable {
    const track: Track | undefined = movie.videoTracks[0];
    if (track === undefined) {
      throw new FrameTableResolutionError("The file has no video track");
    }
    const rawSamples: readonly Sample[] = file.getTrackSamplesInfo(track.id);
    if (rawSamples.length === 0) {
      throw new FrameTableResolutionError("The video track lists no samples");
    }
    const startOffset: number = Mp4SampleTable.presentationOffset(track);
    const toleranceMicroseconds: number = FrameTable.CLOCK_TOLERANCE_SECONDS * 1e6;
    const visibleTimestamps: number[] = rawSamples
      .map((sample: Sample) => Math.round(((sample.cts - startOffset) / sample.timescale) * 1e6))
      .filter((timestamp: number) => timestamp >= -toleranceMicroseconds)
      .sort((left: number, right: number) => left - right);
    const presentationIndexOf: Map<number, number> = new Map(
      visibleTimestamps.map((timestamp: number, index: number) => [timestamp, index]),
    );
    let endSeconds: number = Number.NEGATIVE_INFINITY;
    const samples: Mp4Sample[] = rawSamples.map((sample: Sample, decodeIndex: number): Mp4Sample => {
      const timestampMicroseconds: number = Math.round(((sample.cts - startOffset) / sample.timescale) * 1e6);
      endSeconds = Math.max(endSeconds, (sample.cts + sample.duration - startOffset) / sample.timescale);
      return {
        decodeIndex,
        presentationIndex: presentationIndexOf.get(timestampMicroseconds) ?? null,
        timestampMicroseconds,
        durationMicroseconds: Math.round((sample.duration / sample.timescale) * 1e6),
        isKeyFrame: sample.is_sync,
        offset: sample.offset,
        size: sample.size,
      };
    });
    return new Mp4SampleTable(samples, Mp4SampleTable.decoderConfigOf(file, track), endSeconds);
  }

  private static decoderConfigOf(file: ISOFile, track: Track): VideoDecoderConfig {
    const config: VideoDecoderConfig = {
      codec: track.codec,
      codedWidth: track.video?.width ?? track.track_width,
      codedHeight: track.video?.height ?? track.track_height,
    };
    const entry: SampleEntry | undefined = file.getTrackById(track.id).mdia.minf.stbl.stsd.entries[0];
    if (!(entry instanceof VisualSampleEntry)) {
      return config;
    }
    const stream: MultiBufferStream = new MultiBufferStream();
    if (entry.avcC !== undefined) {
      entry.avcC.write(stream);
    } else if (entry.hvcC !== undefined) {
      entry.hvcC.write(stream);
    } else if (entry.vpcC !== undefined) {
      entry.vpcC.write(stream);
    } else if (entry.av1C !== undefined) {
      entry.av1C.write(stream);
    } else {
      return config;
    }
    return { ...config, description: new Uint8Array(stream.buffer, 8) };
  }

  private static presentationOffset(track: Track): number {
    const firstMediaEdit: { readonly media_time: number } | undefined = (track.edits ?? []).find(
      (edit: { readonly media_time: number }) => edit.media_time >= 0,
    );
    return firstMediaEdit?.media_time ?? 0;
  }
}
