# builtin

## Overview

Plugins of the built-in annotation kinds. Each file implements `AnnotationPlugin` for one kind.

## Components

| Component | Responsibility |
|-----------|----------------|
| [BoundingBoxPlugin.ts](BoundingBoxPlugin.ts) | Draws `BoundingBoxAnnotation` as an outlined box with a tag |
| [KeypointsPlugin.ts](KeypointsPlugin.ts) | Draws `KeypointsAnnotation` as dots joined by skeleton edges |
| [PolygonPlugin.ts](PolygonPlugin.ts) | Draws `PolygonAnnotation` as a filled outline, or a polyline when open |
