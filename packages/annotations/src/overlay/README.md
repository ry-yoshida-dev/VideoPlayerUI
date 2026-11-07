# overlay

## Overview

Drawing and hit testing of annotation layers over a frame, and their theme.

## Components

| Component | Responsibility |
|-----------|----------------|
| [ColorPalette.ts](ColorPalette.ts) | Deterministic assignment of colors to annotations |
| [defaultOverlayTheme.ts](defaultOverlayTheme.ts) | Theme used when an application supplies none |
| [LabelPainter.ts](LabelPainter.ts) | Draws the colored tag naming an annotation, the same for every kind |
| [LabelTheme.ts](LabelTheme.ts) | Appearance of the tag drawn next to an annotation |
| [OverlayComposer.ts](OverlayComposer.ts) | Draws and hit tests the annotation layers of a frame through the plugins of their kinds |
| [OverlayHit.ts](OverlayHit.ts) | Annotation under a point, with the layer it belongs to |
| [OverlayLayer.ts](OverlayLayer.ts) | One stack of annotations drawn over the video, such as ground truth or a model's predictions |
| [OverlayRenderRequest.ts](OverlayRenderRequest.ts) | Inputs of one overlay redraw |
| [OverlayTheme.ts](OverlayTheme.ts) | Appearance of the overlay |
| [RenderContext.ts](RenderContext.ts) | Everything a plugin needs to draw one annotation |
