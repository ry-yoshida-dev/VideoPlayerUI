import type { IconName } from "./IconName.js";

/**
 * Props of {@link Icon}.
 */
export interface IconProps {
  readonly name: IconName;
  /** Edge length in CSS pixels. Defaults to 24. */
  readonly size?: number;
}
