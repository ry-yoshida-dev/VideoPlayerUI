import type { Size } from "../geometry/Size.js";
import type { FrameTable } from "../timeline/FrameTable.js";

/**
 * What a playback engine learns about its media while loading.
 */
export interface MediaInfo {
  /** Decoded frame size in pixels. */
  readonly frameSize: Size;
  /** Presentation timestamps of the stored frames. */
  readonly frameTable: FrameTable;
}
