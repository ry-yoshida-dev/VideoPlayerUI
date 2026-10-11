/**
 * Props of {@link SpeedMenu}.
 */
export interface SpeedMenuProps {
  /** Current speed multiplier. */
  readonly playbackRate: number;
  /** Multipliers offered, in any order. */
  readonly playbackRates: readonly number[];
  /** Accessible name of the menu button. */
  readonly label: string;
  readonly onSelect: (rate: number) => void;
}
