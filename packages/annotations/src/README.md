# src

## Overview

Source of `@video-player-ui/annotations`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [annotation](annotation) | Annotation types of `spec/annotation.md` and the parser of annotation documents |
| [overlay](overlay) | Drawing and hit testing of annotation layers over a frame, and their theme |
| [plugin](plugin) | Plugin contract of annotation kinds and the registry looking them up |
| [source](source) | Sources supplying the annotations of each time id to an overlay layer |
