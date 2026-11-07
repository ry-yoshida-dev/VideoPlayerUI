# @video-player-ui/analysis-web

## Overview

`LiveAnalysis`, an extension of the web `VideoPlayer` that sends frames to a `FrameAnalyzer`, usually a
`WebSocketFrameAnalyzer` connected to an analysis server, and draws the results on the frame they belong to. Frames
are decoded ahead of the playhead with WebCodecs, so results are usually ready before their frame is shown, and a
status in the control bar shows the state and round trip. A URL on another origin needs CORS (see
[supported sources](../../docs/supported-sources.md)).

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
