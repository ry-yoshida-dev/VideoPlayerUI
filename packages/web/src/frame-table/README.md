# frame-table

## Overview

Resolvers finding the presentation timestamps of a video's frames. Each resolver implements `FrameTableResolver`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [ConstantFrameRateResolver.ts](ConstantFrameRateResolver.ts) | Assumes a known constant frame rate, for containers whose sample table cannot be read |
| [FallbackFrameTableResolver.ts](FallbackFrameTableResolver.ts) | Tries resolvers in order and returns the first frame table produced |
| [FrameTableRequest.ts](FrameTableRequest.ts) | What a `FrameTableResolver` knows about the video it resolves |
| [FrameTableResolutionError.ts](FrameTableResolutionError.ts) | Raised when a resolver cannot produce a frame table for a video |
| [FrameTableResolver.ts](FrameTableResolver.ts) | Finds the presentation timestamps of a video's frames, which browsers do not expose |
| [Mp4FrameTableResolver.ts](Mp4FrameTableResolver.ts) | Reads exact frame timestamps from the MP4 or MOV sample table, applying the edit list |
