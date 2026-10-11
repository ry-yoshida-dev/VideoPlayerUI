import type { SkipDirection } from "./SkipDirection.js";

/**
 * Props of {@link SkipIcon}.
 */
export interface SkipIconProps {
  readonly direction: SkipDirection;
  /** Seconds printed inside the arrow. */
  readonly seconds: number;
  /** Edge length in CSS pixels. Defaults to 24. */
  readonly size?: number;
}
