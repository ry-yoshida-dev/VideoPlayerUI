import type { FrameTable } from "@video-player-ui/core";

import type { FrameTableRequest } from "./FrameTableRequest.js";

/**
 * Finds the presentation timestamps of a video's frames, which browsers do
 * not expose.
 */
export interface FrameTableResolver {
  /**
   * Build the frame table of a video.
   *
   * @param request - The video and its reported duration.
   * @returns The frame table.
   * @throws FrameTableResolutionError When this resolver cannot handle the video.
   */
  resolve(request: FrameTableRequest): Promise<FrameTable>;
}
