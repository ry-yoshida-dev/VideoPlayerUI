# @video-player-ui/analysis

## Overview

Platform-independent live analysis: decides which frame goes to an analyzer
and when, and talks to analysis servers over WebSocket following
[spec/analysis-protocol.md](../../spec/analysis-protocol.md). Results land in
a `StreamingAnnotationSource` under the time id of the analyzed frame.

`AnalysisScheduler` keeps up to `maxInFlight` requests outstanding. `offer`
sends a frame only if a slot is free, for producers that capture at one
moment; `request` keeps the latest frame waiting, for paused frames that must
be analyzed; `whenCapacity` lets producers pace themselves and resolves to
`false` once the scheduler is disposed, so they can stop. Frames analyzed
or in flight are never sent again, and failures pause sending for a delay.

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/AnalysisScheduler.ts](src/AnalysisScheduler.ts) | Latest-frame scheduling, result storage, status and retries |
| [src/FrameAnalyzer.ts](src/FrameAnalyzer.ts) | Contract of anything turning frames into annotations |
| [src/AnalysisStatus.ts](src/AnalysisStatus.ts) | Status snapshot: state, frame in flight, last result, latency |
| [src/websocket](src/websocket) | `WebSocketFrameAnalyzer`, request encoder and response decoder |
| [test](test) | Scheduler, protocol and WebSocket client tests |

## Examples

```ts
const analyzer = new WebSocketFrameAnalyzer({ url: "ws://localhost:8765" });
const scheduler = new AnalysisScheduler({ analyzer, source, maxInFlight: 4 });
controller.subscribeFrame((frame) => scheduler.request(frame.timeId, () => captureRequest(frame.timeId)));
```
