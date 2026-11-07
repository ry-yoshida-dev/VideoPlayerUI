# support

## Overview

Test doubles for the analysis tests.

## Components

| Component | Responsibility |
|-----------|----------------|
| [FakeWebSocket.ts](FakeWebSocket.ts) | Stand-in for the browser `WebSocket` that the test opens and feeds by hand |
| [ManualAnalyzer.ts](ManualAnalyzer.ts) | Analyzer whose requests the test answers by hand |
