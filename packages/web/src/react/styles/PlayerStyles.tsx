import type { ReactElement } from "react";

import { playerStyleSheet } from "./styleSheet.js";

/**
 * Injects the player's style sheet once per document, however many players render.
 *
 * @returns The hoisted style element.
 */
export function PlayerStyles(): ReactElement {
  return (
    <style href="video-player-ui" precedence="default">
      {playerStyleSheet}
    </style>
  );
}
