# test

## Overview

Tests of the scheduler, the protocol codec and the WebSocket analyzer, run with `node --test`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [support](support) | Test doubles for the analysis tests |
| [protocol.test.ts](protocol.test.ts) | Request encoding and response decoding tests |
| [scheduler.test.ts](scheduler.test.ts) | `AnalysisScheduler` tests |
| [webSocketFrameAnalyzer.test.ts](webSocketFrameAnalyzer.test.ts) | `WebSocketFrameAnalyzer` tests |
