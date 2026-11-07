# websocket

## Overview

`FrameAnalyzer` over WebSocket and the codec of `spec/analysis-protocol.md`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [AnalysisFailure.ts](AnalysisFailure.ts) | Failed answer to one request |
| [AnalysisResponse.ts](AnalysisResponse.ts) | Any answer of an analysis server |
| [AnalysisResult.ts](AnalysisResult.ts) | Successful answer to one request |
| [AnalysisServerError.ts](AnalysisServerError.ts) | Raised when the analysis server is unreachable, times out or reports a failure |
| [PendingRequest.ts](PendingRequest.ts) | Request waiting for its answer from the analysis server |
| [RequestEncoder.ts](RequestEncoder.ts) | Encodes requests as the binary messages of `spec/analysis-protocol.md` |
| [ResponseDecoder.ts](ResponseDecoder.ts) | Decodes the text messages of `spec/analysis-protocol.md` |
| [ResponseKind.ts](ResponseKind.ts) | Kind of message an analysis server answers with |
| [WebSocketFrameAnalyzer.ts](WebSocketFrameAnalyzer.ts) | `FrameAnalyzer` talking to an analysis server over WebSocket |
| [WebSocketFrameAnalyzerOptions.ts](WebSocketFrameAnalyzerOptions.ts) | Inputs of a `WebSocketFrameAnalyzer` |
