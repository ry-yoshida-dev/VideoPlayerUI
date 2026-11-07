/**
 * Tooltip on screen: its text and where it points, in the player's coordinates.
 */
export interface Tooltip {
  readonly text: string;
  /** Horizontal center of the element it describes. */
  readonly anchorX: number;
  /** Top edge of the element it describes. */
  readonly anchorTop: number;
  /** Bottom edge of the element it describes, used when there is no room above. */
  readonly anchorBottom: number;
}
