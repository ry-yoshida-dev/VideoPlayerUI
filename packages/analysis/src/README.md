# src

## Overview

Source of `@video-player-ui/analysis`: platform-independent scheduling of frames to an analyzer and storage of the results by time id.

## Components

| Component | Responsibility |
|-----------|----------------|
| [websocket](websocket) | `FrameAnalyzer` over WebSocket and the codec of `spec/analysis-protocol.md` |
| [AnalysisRequest.ts](AnalysisRequest.ts) | A frame to analyze, with the time id the results belong to |
| [AnalysisScheduler.ts](AnalysisScheduler.ts) | Sends frames to an analyzer with bounded requests in flight and stores the results by time id |
| [AnalysisSchedulerOptions.ts](AnalysisSchedulerOptions.ts) | Inputs of an `AnalysisScheduler` |
| [AnalysisState.ts](AnalysisState.ts) | Activity of live analysis |
| [AnalysisStatus.ts](AnalysisStatus.ts) | Immutable view of live analysis; a new object is published on every change |
| [EncodedFrame.ts](EncodedFrame.ts) | One frame encoded as an image file, ready to send to an analyzer |
| [FrameAnalyzer.ts](FrameAnalyzer.ts) | Turns frames into annotations, locally or on a server |
| [FrameCapturer.ts](FrameCapturer.ts) | Encodes one frame for analysis; called once, at the moment the frame is sent |
| [QueuedCapture.ts](QueuedCapture.ts) | Frame waiting for a free slot of the scheduler |
