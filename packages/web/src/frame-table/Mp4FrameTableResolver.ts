import type { FrameTable } from "@video-player-ui/core";

import { Mp4SampleTable } from "../decoding/Mp4SampleTable.js";
import { ByteRangeReader } from "../source/ByteRangeReader.js";
import type { FrameTableRequest } from "./FrameTableRequest.js";
import type { FrameTableResolver } from "./FrameTableResolver.js";

/**
 * Reads the exact frame timestamps from the sample table of an MP4 or MOV
 * file, applying the edit list the way browsers and FFmpeg do.
 *
 * Only the container's structure is read and the media data is skipped,
 * wherever the movie header sits; fragmented files are supported.
 */
export class Mp4FrameTableResolver implements FrameTableResolver {
  async resolve(request: FrameTableRequest): Promise<FrameTable> {
    return (await Mp4SampleTable.read(new ByteRangeReader(request.source, request.crossOrigin))).toFrameTable();
  }
}
