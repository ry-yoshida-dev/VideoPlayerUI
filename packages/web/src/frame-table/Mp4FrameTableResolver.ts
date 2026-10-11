import type { FrameTable } from "@video-player-ui/core";

import { Mp4SampleTable } from "../decoding/Mp4SampleTable.js";
import type { FrameTableRequest } from "./FrameTableRequest.js";
import type { FrameTableResolver } from "./FrameTableResolver.js";

/**
 * Reads the exact frame timestamps from the sample table of an MP4 or MOV
 * file, applying the edit list the way browsers and FFmpeg do.
 *
 * Reading stops as soon as the movie header is parsed, so files with the
 * header in front cost only their first chunks.
 */
export class Mp4FrameTableResolver implements FrameTableResolver {
  async resolve(request: FrameTableRequest): Promise<FrameTable> {
    return (await Mp4SampleTable.read(request.source)).toFrameTable();
  }
}
