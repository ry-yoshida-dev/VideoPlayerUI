import type { Ref } from "react";

import type { FrameCanvasHandle } from "./FrameCanvasHandle.js";
import type { FrameDrawContext } from "./FrameDrawContext.js";
import type { FramePointer } from "./FramePointer.js";

/**
 * Props of {@link FrameCanvas}.
 */
export interface FrameCanvasProps {
  /** Draws one frame; a new function triggers a redraw, so memoize it on what it draws. */
  readonly draw: (context: FrameDrawContext) => void;
  /** Receives {@link FrameCanvasHandle.redraw}. */
  readonly ref?: Ref<FrameCanvasHandle | null>;
  /** Pointer moved over the canvas. */
  readonly onPointerMove?: (pointer: FramePointer) => void;
  /** Pointer left the canvas. */
  readonly onPointerLeave?: () => void;
  /** Canvas clicked; return true to consume the click so it does not toggle playback. */
  readonly onClick?: (pointer: FramePointer) => boolean;
  /** CSS cursor over the canvas. */
  readonly cursor?: string;
  readonly className?: string;
}
