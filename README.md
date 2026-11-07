# VideoPlayerUI

## Overview

VideoPlayerUI is a frame-accurate video player for engineers inspecting footage, such as model outputs on recorded
video, embedded in React applications. It runs entirely on the client, plays URLs and local files
([supported sources](docs/supported-sources.md)) and never covers the picture: its controls sit below it.
Extensions add frame-synchronized drawing, controls and shortcuts; live analysis sends the frame on screen to a Python
server and draws the returned boxes, polygons and keypoints on the frame they belong to. Time ids follow
[TimeSeriesIterator](https://github.com/ry-yoshida-dev/TimeSeriesIterator), so data produced by a Python pipeline
lands on the same frames.

| Package | Role |
|---------|------|
| [packages/core](packages/core) | Platform-independent player: timeline, frame table, playback state machine, drawing contract |
| [packages/web](packages/web) | React DOM player with icon-based controls and extension points (`FrameCanvas`, control slot, shortcuts) |
| [packages/annotations](packages/annotations) | Optional, platform-independent annotation format, sources, plugins and overlay drawing |
| [packages/annotations-web](packages/annotations-web) | Optional `AnnotationLayer` extension for the web player |
| [packages/analysis](packages/analysis) | Optional, platform-independent live analysis scheduling and WebSocket client |
| [packages/analysis-web](packages/analysis-web) | Optional `LiveAnalysis` extension for the web player |
| [servers/python](servers/python) | Python analysis server: frames in as `numpy`, annotations out |
| [examples/web](examples/web) | Demo app playing a generated sample or files picked from disk |
| [spec](spec) | Timeline, annotation format and analysis protocol specifications |
| [docs](docs) | [Supported sources](docs/supported-sources.md) of the web player |

## Installation

Every package is attached to the GitHub release of its version as an npm tarball.

The packages are not on the npm registry, and they depend on each other by exact version. List the packages you import
under `dependencies`, and pin all six to the same release under `overrides` so that npm resolves every
`@video-player-ui` package, direct or transitive, from the release instead of the registry:

```json
{
  "dependencies": {
    "@video-player-ui/web": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-web-0.1.1.tgz"
  },
  "overrides": {
    "@video-player-ui/core": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-core-0.1.1.tgz",
    "@video-player-ui/web": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-web-0.1.1.tgz",
    "@video-player-ui/annotations": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-annotations-0.1.1.tgz",
    "@video-player-ui/annotations-web": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-annotations-web-0.1.1.tgz",
    "@video-player-ui/analysis": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-analysis-0.1.1.tgz",
    "@video-player-ui/analysis-web": "https://github.com/ry-yoshida-dev/VideoPlayerUI/releases/download/v0.1.1/video-player-ui-analysis-web-0.1.1.tgz"
  }
}
```

A `dependencies` entry must be the same URL as its `overrides` entry. `overrides` is an npm feature; with pnpm use
`pnpm.overrides`, with Yarn use `resolutions`.

## Usage

Plain player:

```tsx
import { VideoPlayer } from "@video-player-ui/web";

<VideoPlayer source={fileOrUrl} />;
```

With live analysis on a Python server:

```tsx
import { WebSocketFrameAnalyzer } from "@video-player-ui/analysis";
import { LiveAnalysis } from "@video-player-ui/analysis-web";

const analyzer = useMemo(() => new WebSocketFrameAnalyzer({ url: "ws://localhost:8765" }), []);

<VideoPlayer source={fileOrUrl}>
  <LiveAnalysis analyzer={analyzer} onAnnotationClick={(hit) => console.log(hit)} />
</VideoPlayer>;
```

```python
class Detector:
    def analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        return [BoundingBox(x=10, y=20, width=190, height=380, label="person", score=0.87)]

AnalysisServer(Detector(), port=8765).run()
```

## Development

```bash
npm install
npm run build
npm run sample --workspace examples/web
npm run dev --workspace examples/web
python servers/python/examples/serve_orange_box.py
```

`npm run sample` renders the demo video with ffmpeg; it is not committed. GitHub Actions runs the npm `test`,
`typecheck`, `lint` and `format:check` scripts, plus ruff, mypy, basedpyright and pytest for
[servers/python](servers/python), on every push and pull request. Pushing a tag `vX.Y.Z` whose version every package
carries builds, tests and publishes the release.

`npm test` includes the conformance cases generated from the Python
TimeSeriesIterator; see [spec/conformance](spec/conformance).
