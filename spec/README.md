# spec

## Overview

Language-independent specifications every VideoPlayerUI implementation follows.

## Components

| Component | Responsibility |
|-----------|----------------|
| [timeline.md](timeline.md) | Mapping between stored frames, presentation time and time ids, matching TimeSeriesIterator |
| [annotation.md](annotation.md) | Annotation document format, built-in kinds and custom kinds |
| [annotation.schema.json](annotation.schema.json) | JSON Schema of the annotation document |
| [analysis-protocol.md](analysis-protocol.md) | WebSocket messages between the player and an analysis server |
| [conformance](conformance) | Timeline test cases generated from the Python implementation |
