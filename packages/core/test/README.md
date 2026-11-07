# test

## Overview

Tests of the timeline, frame table, controller and viewport transform, run with `node --test`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [support](support) | Test doubles for the core tests |
| [frameTable.test.ts](frameTable.test.ts) | `FrameTable` tests |
| [playerController.test.ts](playerController.test.ts) | `PlayerController` state machine tests |
| [timeline.test.ts](timeline.test.ts) | Timeline conformance with TimeSeriesIterator and stepping tests |
| [viewportTransform.test.ts](viewportTransform.test.ts) | `ViewportTransform` tests |
