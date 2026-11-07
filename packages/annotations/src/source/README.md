# source

## Overview

Sources supplying the annotations of each time id to an overlay layer.

## Components

| Component | Responsibility |
|-----------|----------------|
| [AnnotationLookupOptions.ts](AnnotationLookupOptions.ts) | How a source resolves time ids to annotations |
| [AnnotationLookupPolicy.ts](AnnotationLookupPolicy.ts) | Which annotations a frame without its own annotations shows |
| [AnnotationSource.ts](AnnotationSource.ts) | Supplies the annotations of each time id to an overlay layer |
| [FrameAnnotationIndex.ts](FrameAnnotationIndex.ts) | Annotations by time id, kept sorted for lookups that hold earlier frames |
| [StaticAnnotationSource.ts](StaticAnnotationSource.ts) | Annotations fixed at construction, as loaded from a document |
| [StreamingAnnotationSource.ts](StreamingAnnotationSource.ts) | Annotations pushed while the media plays, as from a WebSocket or an on-device model |
