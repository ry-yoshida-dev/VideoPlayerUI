import type { FrameAnalyzer } from "@video-player-ui/analysis";
import type { AnnotationLookupOptions, AnnotationPluginRegistry, OverlayHit, OverlayTheme } from "@video-player-ui/annotations";
import type { AnnotationLayerLabels } from "@video-player-ui/annotations-web";
import type { ImageEncoding } from "@video-player-ui/web";

import type { LiveAnalysisLabels } from "./LiveAnalysisLabels.js";

/**
 * Props of {@link LiveAnalysis}.
 */
export interface LiveAnalysisProps {
  /** Analyzer the frames go to; it stays owned by the caller. */
  readonly analyzer: FrameAnalyzer;
  /** Image format of the frames sent. Defaults to PNG, which is lossless. */
  readonly encoding?: ImageEncoding;
  /** Quality in `[0, 1]` for lossy formats. */
  readonly quality?: number;
  /**
   * How far ahead of the playhead frames are decoded and analyzed, in
   * seconds, so results are ready when the frame is shown. Defaults to 1;
   * 0 analyzes only the frame on screen.
   */
  readonly lookaheadSeconds?: number;
  /** Requests sent before earlier ones return. Defaults to 4. */
  readonly maxInFlight?: number;
  /** How frames between analyzed ones show results. Defaults to holding the previous result. */
  readonly lookup?: AnnotationLookupOptions;
  /** Plugins drawing each kind. */
  readonly plugins?: AnnotationPluginRegistry;
  /** Overlay appearance. */
  readonly theme?: OverlayTheme;
  /** Called when a result annotation is clicked. */
  readonly onAnnotationClick?: (hit: OverlayHit) => void;
  /** Whether the status is shown in the control bar. Defaults to true. */
  readonly isStatusVisible?: boolean;
  readonly labels?: Partial<LiveAnalysisLabels>;
  readonly layerLabels?: Partial<AnnotationLayerLabels>;
}
