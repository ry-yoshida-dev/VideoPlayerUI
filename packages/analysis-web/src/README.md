# src

## Overview

Source of `@video-player-ui/analysis-web`: the `LiveAnalysis` extension of the web player and its decoding look-ahead.

## Components

| Component | Responsibility |
|-----------|----------------|
| [AnalysisStatusChip.tsx](AnalysisStatusChip.tsx) | Compact status of live analysis: state, latest round trip and how far the result shown lags |
| [AnalysisStatusChipProps.ts](AnalysisStatusChipProps.ts) | Props of `AnalysisStatusChip` |
| [analysisStyleSheet.ts](analysisStyleSheet.ts) | Style sheet of the live analysis status |
| [DecodingLookahead.ts](DecodingLookahead.ts) | Decodes ahead of the playhead with WebCodecs so results are ready when playback reaches a frame |
| [DecodingLookaheadOptions.ts](DecodingLookaheadOptions.ts) | Inputs of a `DecodingLookahead` |
| [defaultLiveAnalysisLabels.ts](defaultLiveAnalysisLabels.ts) | English texts used when an application supplies none |
| [LiveAnalysis.tsx](LiveAnalysis.tsx) | Analyzes frames with a `FrameAnalyzer` and draws the results on the frame they belong to |
| [LiveAnalysisLabels.ts](LiveAnalysisLabels.ts) | Texts of the analysis status and its tooltip; replace them to translate |
| [LiveAnalysisProps.ts](LiveAnalysisProps.ts) | Props of `LiveAnalysis` |
| [LookaheadDecoder.ts](LookaheadDecoder.ts) | Source of decoded frames the look-ahead runs with, such as `SequentialFrameDecoder` |
| [LookaheadWindow.ts](LookaheadWindow.ts) | Stored frames the look-ahead should have analyzed |
