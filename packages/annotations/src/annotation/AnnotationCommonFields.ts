import type { AttributeValue } from "./AttributeValue.js";
import type { TrackId } from "./TrackId.js";

/**
 * Optional fields every annotation kind may carry.
 */
export interface AnnotationCommonFields {
  /** Class name; drives the default color. */
  readonly label?: string;
  /** Confidence in `[0, 1]`. */
  readonly score?: number;
  /** Identity across frames; takes precedence over `label` for color. */
  readonly trackId?: TrackId;
  /** CSS color overriding the palette. */
  readonly color?: string;
  /** Free-form values for application use. */
  readonly attributes?: Readonly<Record<string, AttributeValue>>;
}
