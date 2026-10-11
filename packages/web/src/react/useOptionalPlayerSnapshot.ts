import { useCallback, useSyncExternalStore } from "react";
import type { PlayerController, PlayerSnapshot } from "@video-player-ui/core";

/**
 * Snapshot of a player that may not exist yet.
 *
 * @param controller - Player to observe, or null.
 * @returns The snapshot, or null without a player.
 */
export function useOptionalPlayerSnapshot(controller: PlayerController | null): PlayerSnapshot | null {
  const subscribe: (listener: () => void) => () => void = useCallback(
    (listener: () => void): (() => void) => (controller === null ? () => undefined : controller.subscribe(listener)),
    [controller],
  );
  const getSnapshot: () => PlayerSnapshot | null = useCallback(
    (): PlayerSnapshot | null => (controller === null ? null : controller.getSnapshot()),
    [controller],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
