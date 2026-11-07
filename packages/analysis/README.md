# @video-player-ui/analysis

## Overview

Platform-independent live analysis: decides which frame goes to an analyzer and when, and talks to analysis servers
over WebSocket following [spec/analysis-protocol.md](../../spec/analysis-protocol.md). Results land in a
`StreamingAnnotationSource` under the time id of the analyzed frame.

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
