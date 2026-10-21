# @video-player-ui/core

## Overview

Platform-independent player: no DOM, no React Native, no knowledge of what is
drawn over the video. It holds the timeline of `spec/timeline.md`, the frame
table that resolves clocks to exact frames, the playback state machine and the
drawing contract that overlays use on every platform.

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/timeline](src/timeline) | `TimelineParameters`, `Timeline` (time id ↔ frame) and `FrameTable` (clock ↔ frame) |
| [src/player](src/player) | `PlaybackEngine` contract and `PlayerController` (play, hold, seek, skip, step, rate, mute, loop) |
| [src/drawing](src/drawing) | `DrawingSurface`, the drawing commands platform overlays implement |
| [src/geometry](src/geometry) | Points, sizes, rectangles and `ViewportTransform` for letterboxing |
| [src/event](src/event) | Listener sets and unsubscribe functions |
| [test](test) | Node test suites, including the TimeSeriesIterator conformance cases |

## Examples

```ts
const controller = new PlayerController({ engine, timeline: { samplingFrequency: 5 } });
await controller.load();
await controller.seekBy(30);
await controller.stepForward();
controller.subscribeFrame((frame) => console.log(frame.timeId, frame.presentationSeconds));
```
