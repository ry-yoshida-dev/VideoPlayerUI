# @video-player-ui/annotations-web

## Overview

`AnnotationLayer`, an extension of the web `VideoPlayer` that draws
`@video-player-ui/annotations` layers in step with the frame on screen. It
highlights the annotation under the pointer, reports clicks, adds a show/hide
button to the control bar and binds the `A` key, all through the player's
public extension points.

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/AnnotationLayer.tsx](src/AnnotationLayer.tsx) | The extension component |
| [src/AnnotationLayerProps.ts](src/AnnotationLayerProps.ts) | Its props |
| [src/AnnotationLayerLabels.ts](src/AnnotationLayerLabels.ts) | Tooltips of the toggle button |
| [src/defaultAnnotationLayerLabels.ts](src/defaultAnnotationLayerLabels.ts) | English tooltips |

## Examples

```tsx
<VideoPlayer source={file}>
  <AnnotationLayer
    layers={layers}
    plugins={plugins}
    onAnnotationClick={(hit) => select(hit.annotation)}
    labels={{ show: "注釈を表示", hide: "注釈を隠す" }}
  />
</VideoPlayer>
```
