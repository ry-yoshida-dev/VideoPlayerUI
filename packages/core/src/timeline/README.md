# timeline

## Overview

Mapping between stored frames and time ids, following `spec/timeline.md`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [FrameTable.ts](FrameTable.ts) | Presentation timestamps of the stored frames of a media source |
| [IndexBase.ts](IndexBase.ts) | Time id of the first raw frame |
| [Timeline.ts](Timeline.ts) | Mapping between stored media frames and time ids, following `spec/timeline.md` |
| [TimelineParameters.ts](TimelineParameters.ts) | Validated sampling parameters of a timeline |
| [TimelineParametersInit.ts](TimelineParametersInit.ts) | Optional inputs of `TimelineParameters`, defaulting as TimeSeriesIterator does |
