# support

## Overview

Test doubles for the look-ahead tests.

## Components

| Component | Responsibility |
|-----------|----------------|
| [FakeCanvasDocument.ts](FakeCanvasDocument.ts) | Canvas whose encoding yields a one-byte image |
| [FakeLookaheadDecoder.ts](FakeLookaheadDecoder.ts) | Decoder handing out frames that record whether they were released |
| [FakePlaybackEngine.ts](FakePlaybackEngine.ts) | Engine that presents every seek target at once |
| [ImmediateAnalyzer.ts](ImmediateAnalyzer.ts) | Analyzer answering every request on the next turn with one box labelled by time id |
