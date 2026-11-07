# src

## Overview

Source of `@video-player-ui/core`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [drawing](drawing) | Platform-neutral drawing contract that overlays draw through |
| [event](event) | Listener registration shared by the observable classes |
| [geometry](geometry) | Points, sizes and the mapping between frame and view coordinates |
| [player](player) | Playback state machine and the contract of the platform playback engine |
| [timeline](timeline) | Mapping between stored frames and time ids, following `spec/timeline.md` |
