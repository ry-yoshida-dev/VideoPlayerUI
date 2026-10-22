# VideoPlayerUI

## Overview

VideoPlayerUI is a frame-accurate video player for engineers inspecting
footage, such as model outputs on recorded video, embedded in React
applications. It runs entirely on the client and plays URLs and local files
([supported sources](packages/web/README.md#supported-sources)).
The picture is never covered: icon-based controls sit below it and offer a
seek bar showing time ids, play, 10 s back, 30 s forward, frame step, frame
copy, a time id field that jumps on Enter, speed, mute, loop and full screen.

The player draws nothing over the video by itself. Extensions add
frame-synchronized drawing, controls and shortcuts. Live analysis is one of
them: the frame on screen goes to a Python analysis server and the returned
boxes, polygons and keypoints are drawn on the frame they belong to. Time ids follow [TimeSeriesIterator](https://github.com/ry-yoshida-dev/TimeSeriesIterator),
so data produced by a Python pipeline lands on the same frames.

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

A React Native (Expo) player for iOS and Android is planned on top of
`@video-player-ui/core`; `@video-player-ui/annotations` is shared as is.

## Architecture

```
 core            PlayerController ── Timeline / FrameTable
                        │
                  PlaybackEngine (HTML video, AVPlayer…)     DrawingSurface (contract)
                        │                                          │
 web             VideoPlayer ── extension points: FrameCanvas, PlayerControlSlot,
                                usePlayerShortcut, showFeedback
                        ▲
 annotations-web  AnnotationLayer (one extension among others)
                        │
 annotations      OverlayComposer ── AnnotationPluginRegistry ── AnnotationSource
```

- `PlaybackEngine` is the only platform-specific decoding code; a local file,
  an HTTP stream and frames served by a backend are different engines.
- `FrameCanvas` calls a draw function once per frame on screen, for any
  overlay: annotations, subtitles, heat maps or guides.
- Annotation plugins draw through the platform-neutral `DrawingSurface`, so a
  plugin works on every platform.

## Installation

Every package is attached to the GitHub release of its version as an npm tarball. Pushing a tag `vX.Y.Z` whose version
every package carries builds, tests and publishes them.

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

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
npm run format:check
npm run sample --workspace examples/web
npm run dev --workspace examples/web
python servers/python/examples/serve_orange_box.py
```

`npm run sample` renders the demo video with ffmpeg; it is not committed.
GitHub Actions runs the same checks, plus ruff, mypy, basedpyright and
pytest for [servers/python](servers/python), on every push and pull request.

`npm test` includes the conformance cases generated from the Python
TimeSeriesIterator; see [spec/conformance](spec/conformance).

## Example

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
