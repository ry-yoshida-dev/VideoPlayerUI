import type { ReactNode } from "react";

/**
 * One showing of the brief glyph in the middle of the player; a new serial
 * restarts its animation.
 */
export interface Feedback {
  readonly content: ReactNode;
  readonly serial: number;
}
