# scripts

## Overview

Node scripts rendering the demo's sample video, whose moving box follows a known formula.

## Components

| Component | Responsibility |
|-----------|----------------|
| [generateSample.ts](generateSample.ts) | Renders `public/sample/sample.mp4` with ffmpeg |
| [SampleExpressions.ts](SampleExpressions.ts) | ffmpeg expressions placing the sample's moving box |
| [SampleTrajectory.ts](SampleTrajectory.ts) | Motion of the sample's moving box, as a formula of the frame index |
