import { FrameTable } from "@video-player-ui/core";

import type { FrameTableRequest } from "./FrameTableRequest.js";
import type { FrameTableResolver } from "./FrameTableResolver.js";
import { FrameTableResolutionError } from "./FrameTableResolutionError.js";

/**
 * Assumes a known constant frame rate, for containers whose sample table
 * cannot be read.
 */
export class ConstantFrameRateResolver implements FrameTableResolver {
  private readonly framesPerSecond: number;

  /**
   * Store the frame rate.
   *
   * @param framesPerSecond - Frame rate of the video; positive.
   * @throws RangeError When the rate is not positive and finite.
   */
  constructor(framesPerSecond: number) {
    if (!Number.isFinite(framesPerSecond) || framesPerSecond <= 0) {
      throw new RangeError(`framesPerSecond must be positive, given: ${framesPerSecond}`);
    }
    this.framesPerSecond = framesPerSecond;
  }

  resolve(request: FrameTableRequest): Promise<FrameTable> {
    if (!Number.isFinite(request.durationSeconds) || request.durationSeconds <= 0) {
      return Promise.reject(
        new FrameTableResolutionError(`A constant frame rate needs a finite duration, the browser reported ${request.durationSeconds}`),
      );
    }
    const frameCount: number = Math.max(1, Math.round(request.durationSeconds * this.framesPerSecond));
    return Promise.resolve(FrameTable.fromConstantFrameRate(frameCount, this.framesPerSecond));
  }
}
