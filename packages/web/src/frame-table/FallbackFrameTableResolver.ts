import type { FrameTable } from "@video-player-ui/core";

import type { FrameTableRequest } from "./FrameTableRequest.js";
import type { FrameTableResolver } from "./FrameTableResolver.js";
import { FrameTableResolutionError } from "./FrameTableResolutionError.js";

/**
 * Tries resolvers in order and returns the first frame table produced.
 */
export class FallbackFrameTableResolver implements FrameTableResolver {
  private readonly resolvers: readonly FrameTableResolver[];

  /**
   * Store the resolvers.
   *
   * @param resolvers - Resolvers in order of preference; at least one.
   * @throws RangeError When no resolver is given.
   */
  constructor(resolvers: readonly FrameTableResolver[]) {
    if (resolvers.length === 0) {
      throw new RangeError("FallbackFrameTableResolver needs at least one resolver");
    }
    this.resolvers = resolvers;
  }

  async resolve(request: FrameTableRequest): Promise<FrameTable> {
    const failures: FrameTableResolutionError[] = [];
    for (const resolver of this.resolvers) {
      try {
        return await resolver.resolve(request);
      } catch (error: unknown) {
        if (!(error instanceof FrameTableResolutionError)) {
          throw error;
        }
        failures.push(error);
      }
    }
    throw new FrameTableResolutionError(
      `No resolver produced a frame table: ${failures.map((failure: FrameTableResolutionError) => failure.message).join("; ")}`,
      { cause: failures },
    );
  }
}
