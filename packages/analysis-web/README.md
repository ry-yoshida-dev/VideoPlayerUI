# @video-player-ui/analysis-web

## Overview

`LiveAnalysis`, an extension of the web `VideoPlayer` that sends frames to a
`FrameAnalyzer`, usually a `WebSocketFrameAnalyzer` connected to an analysis
server, and draws the results on the frame they belong to.

The video is decoded ahead of the playhead with WebCodecs (`lookaheadSeconds`,
1 s by default) and those frames are sent at the pace the analyzer accepts,
with up to `maxInFlight` requests outstanding, so results are ready before
their frame is shown. Decoded frames carry their own timestamps, so a result
always belongs to the frame analyzed. Frames that could not get a result in
time, as right after a seek, are skipped; paused frames and the frames after
them are analyzed, ready for stepping. Frames without their own result show
the latest earlier result faded, and a status in the control bar shows the
state (green idle, blue analyzing, red failed), the round trip and how many
time ids the shown result trails the frame on screen. Hovering it shows the
details, such as the number of analyzed frames.

Without WebCodecs or for non-MP4 sources, the frame on screen is captured
from the video element instead; results then trail playback by the round trip.
Either way, a URL on another origin needs the player's `crossOrigin` set and
CORS headers on its server, as described in the
[web package](../web/README.md#supported-sources).

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/LiveAnalysis.tsx](src/LiveAnalysis.tsx) | The extension: scheduling, capture and drawing |
| [src/DecodingLookahead.ts](src/DecodingLookahead.ts) | Decodes ahead of the playhead and feeds frames to the scheduler |
| [src/DecodingLookaheadOptions.ts](src/DecodingLookaheadOptions.ts) | Inputs of the look-ahead |
| [src/LookaheadDecoder.ts](src/LookaheadDecoder.ts) | Frame source the look-ahead decodes from, such as `SequentialFrameDecoder` |
| [src/LookaheadWindow.ts](src/LookaheadWindow.ts) | Frames the look-ahead aims to cover |
| [src/LiveAnalysisProps.ts](src/LiveAnalysisProps.ts) | Its props |
| [src/AnalysisStatusChip.tsx](src/AnalysisStatusChip.tsx) | Status shown in the control bar |
| [src/AnalysisStatusChipProps.ts](src/AnalysisStatusChipProps.ts) | Props of the status |
| [src/LiveAnalysisLabels.ts](src/LiveAnalysisLabels.ts) | Texts of the status |
| [src/defaultLiveAnalysisLabels.ts](src/defaultLiveAnalysisLabels.ts) | English texts |
| [src/analysisStyleSheet.ts](src/analysisStyleSheet.ts) | Styles of the status |
| [test](test) | Look-ahead tests against a fake decoder, player engine and analyzer |

## Examples

```tsx
const analyzer = useMemo(() => new WebSocketFrameAnalyzer({ url: "ws://gpu-host:8765" }), []);

<VideoPlayer source={file}>
  <LiveAnalysis analyzer={analyzer} encoding={ImageEncoding.JPEG} quality={0.9} />
</VideoPlayer>;
```
