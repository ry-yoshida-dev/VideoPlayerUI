# examples/web

## Overview

Demo of `@video-player-ui/web` with live analysis. It plays a generated
sample whose moving box follows a known formula, sends the frames on screen
to the Python sample detector and draws its boxes, so any mismatch between a
frame and its result is visible. Videos picked from disk play as well.

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/App.tsx](src/App.tsx) | Page with the player, `LiveAnalysis`, the video picker and the clicked annotation |
| [src/OpenFileGlyph.tsx](src/OpenFileGlyph.tsx) | Monochrome glyph of the video picker |
| [scripts/generateSample.ts](scripts/generateSample.ts) | Renders `public/sample/sample.mp4` with ffmpeg |
| [scripts/SampleTrajectory.ts](scripts/SampleTrajectory.ts) | Motion of the rendered box |
| [scripts/SampleExpressions.ts](scripts/SampleExpressions.ts) | ffmpeg expressions of the motion |

## Examples

```bash
npm run build
npm run sample --workspace examples/web
npm run dev --workspace examples/web
python ../../servers/python/examples/serve_orange_box.py
```

Add `?analysis=ws://host:port` to the page URL to use another server, and
`?lookahead=0` to analyze only the frame on screen.
