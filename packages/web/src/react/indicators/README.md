# indicators

## Overview

Transient glyphs and tooltips shown over the player.

## Components

| Component | Responsibility |
|-----------|----------------|
| [CenterIndicator.tsx](CenterIndicator.tsx) | Glyph in the middle of the video: spinner while loading, warning on failure, brief echo of commands |
| [CenterIndicatorProps.ts](CenterIndicatorProps.ts) | Props of `CenterIndicator` |
| [Feedback.ts](Feedback.ts) | One showing of the brief glyph in the middle of the player; a new serial restarts its animation |
| [Tooltip.ts](Tooltip.ts) | Tooltip on screen: its text and where it points, in the player's coordinates |
| [TooltipLayer.tsx](TooltipLayer.tsx) | Shows the `data-vpui-tooltip` text of the element under the mouse |
| [TooltipLayerProps.ts](TooltipLayerProps.ts) | Props of `TooltipLayer` |
