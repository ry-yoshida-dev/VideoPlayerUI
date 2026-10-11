import { ColorPalette } from "./ColorPalette.js";
import type { OverlayTheme } from "./OverlayTheme.js";

/**
 * Theme used when an application supplies none.
 */
export const defaultOverlayTheme: OverlayTheme = {
  palette: new ColorPalette(),
  lineWidth: 2,
  highlightLineWidth: 4,
  fillOpacity: 0.2,
  highlightFillOpacity: 0.35,
  heldOpacity: 0.4,
  keypointRadius: 3.5,
  keypointScoreThreshold: 0,
  label: {
    isVisible: true,
    isScoreVisible: true,
    isTrackIdVisible: true,
    fontSize: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 600,
    textColor: "#ffffff",
    padding: 3,
  },
};
