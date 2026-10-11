# video-player-ui-server

## Overview

Python side of VideoPlayerUI live analysis. `AnalysisServer` speaks
[spec/analysis-protocol.md](../../spec/analysis-protocol.md) over WebSocket:
it decodes each frame sent by the player into an RGB `numpy` array, runs your
`FrameAnalyzer` on a worker thread and answers with its annotations in pixel
coordinates. Any detector, tracker or model fits behind `FrameAnalyzer`.

## Installation

```bash
pip install -e ".[dev]"
```

## Examples

```python
from collections.abc import Sequence

from video_player_ui_server import AnalysisFrame, AnalysisServer, AnnotationBase, BoundingBox


class PersonDetector:
    def analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        return [BoundingBox(x=10, y=20, width=190, height=380, label="person", score=0.87)]


AnalysisServer(PersonDetector(), host="0.0.0.0", port=8765).run()
```

The web example connects to `ws://localhost:8765`; serve the sample detector
for it with:

```bash
python examples/serve_orange_box.py --delay 0.05
```

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/video_player_ui_server](src/video_player_ui_server) | Server, analyzer contract, annotation types and protocol codec |
| [examples](examples) | Color-threshold detector for the generated sample video and its server |
| [tests](tests) | Protocol tests and end-to-end tests over a real WebSocket |
