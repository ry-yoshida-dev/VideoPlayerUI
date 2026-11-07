# capture

## Overview

Copying the frame on screen as an encoded image.

## Components

| Component | Responsibility |
|-----------|----------------|
| [CapturedFrame.ts](CapturedFrame.ts) | Encoded frame together with the time id it shows |
| [FrameCapture.ts](FrameCapture.ts) | Copies the frame an `HTMLVideoElement` is showing, at the video's own resolution |
| [FrameCaptureOptions.ts](FrameCaptureOptions.ts) | How `FrameCapture` encodes a frame |
| [ImageEncoding.ts](ImageEncoding.ts) | Image formats a frame can be encoded in |
