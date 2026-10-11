import type { PlayerController } from "@video-player-ui/core";

import { usePlayerContext } from "./usePlayerContext.js";

/**
 * Controller of the enclosing {@link VideoPlayer}.
 *
 * @returns The controller.
 * @throws Error When called outside a {@link VideoPlayer}'s children.
 */
export function usePlayerController(): PlayerController {
  return usePlayerContext().controller;
}
