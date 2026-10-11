# video_player_ui_server

## Overview

Package of the analysis server: receives frames, runs a `FrameAnalyzer` and
returns annotations.

## Components

| Component | Responsibility |
|-----------|----------------|
| [analysis_server.py](analysis_server.py) | `AnalysisServer`: WebSocket server running the analyzer on worker threads |
| [frame_analyzer.py](frame_analyzer.py) | `FrameAnalyzer` protocol implemented by user code |
| [json_value.py](json_value.py) | JSON value type |
| [annotation](annotation) | Annotation types serialized to the player's format |
| [protocol](protocol) | Request decoding, response encoding and the decoded frame |
