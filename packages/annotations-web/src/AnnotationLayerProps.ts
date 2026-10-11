import type { AnnotationPluginRegistry, OverlayHit, OverlayLayer, OverlayTheme } from "@video-player-ui/annotations";

import type { AnnotationLayerLabels } from "./AnnotationLayerLabels.js";

/**
 * Props of {@link AnnotationLayer}.
 */
export interface AnnotationLayerProps {
  /** Layers drawn bottom to top. */
  readonly layers: readonly OverlayLayer[];
  /** Plugins drawing each kind. Defaults to the built-in kinds. */
  readonly plugins?: AnnotationPluginRegistry;
  /** Overlay appearance. Defaults to `defaultOverlayTheme`. */
  readonly theme?: OverlayTheme;
  /** Called when an annotation is clicked; the click then does not toggle playback. */
  readonly onAnnotationClick?: (hit: OverlayHit) => void;
  /** Called when the annotation under the pointer changes, with null when none is. */
  readonly onAnnotationHover?: (hit: OverlayHit | null) => void;
  /** Whether a show/hide button is added to the control bar. Defaults to true. */
  readonly isToggleVisible?: boolean;
  /** Key toggling the annotations, or null for none. Defaults to `a`. */
  readonly toggleKey?: string | null;
  /** Initial visibility. Defaults to true. */
  readonly isInitiallyVisible?: boolean;
  readonly labels?: Partial<AnnotationLayerLabels>;
}
