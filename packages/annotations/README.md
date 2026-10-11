# @video-player-ui/annotations

## Overview

Optional annotation support, independent of any platform: the document format
of `spec/annotation.md`, annotation sources, the plugins that parse, draw and
hit test each kind, and the composer that draws layers on a
`DrawingSurface`. Platform packages such as `@video-player-ui/annotations-web`
connect it to a player.

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/annotation](src/annotation) | Annotation types, `AnnotationDocumentParser` and its path-aware JSON reader |
| [src/plugin](src/plugin) | `AnnotationPlugin` contract, registry and the bounding box, polygon and keypoints plugins |
| [src/source](src/source) | `AnnotationSource` contract with static and streaming sources and hold-previous lookup |
| [src/overlay](src/overlay) | Layers, theme, palette, tag painter and `OverlayComposer` |
| [test](test) | Parser, source and composer tests |

## Examples

Custom annotation kind, drawn on every platform:

```ts
import type { AnnotationBase, AnnotationPlugin } from "@video-player-ui/annotations";

interface HeatPointAnnotation extends AnnotationBase<"heat-point"> {
  readonly x: number;
  readonly y: number;
}

declare module "@video-player-ui/annotations" {
  interface AnnotationTypeMap {
    "heat-point": HeatPointAnnotation;
  }
}

class HeatPointPlugin implements AnnotationPlugin<"heat-point"> {
  readonly kind = "heat-point";
  parse(reader, context) {
    return { ...context.readCommonFields(reader), kind: this.kind, ...context.readPoint(reader) };
  }
  render(annotation, context) {
    context.surface.fillCircle(context.transform.toView(annotation), 8, context.color);
  }
}

const plugins = AnnotationPluginRegistry.withBuiltins().register(new HeatPointPlugin());
```

Annotations streamed from a server or an on-device model:

```ts
const live = new StreamingAnnotationSource({ maxHoldTimeIds: 15 });
socket.onmessage = (message) => {
  const { timeId, annotations } = JSON.parse(message.data);
  live.put(timeId, annotations);
};
```
