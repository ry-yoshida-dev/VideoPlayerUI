# geometry

## Overview

Points, sizes and the mapping between frame and view coordinates.

## Components

| Component | Responsibility |
|-----------|----------------|
| [ContentFit.ts](ContentFit.ts) | How a frame is scaled into a view of another aspect ratio |
| [Point.ts](Point.ts) | Position in a two-dimensional coordinate space, `x` to the right and `y` down |
| [Rect.ts](Rect.ts) | Axis-aligned rectangle given by its top-left corner and extent |
| [Size.ts](Size.ts) | Extent of a two-dimensional area |
| [ViewportTransform.ts](ViewportTransform.ts) | Mapping between normalized frame coordinates and view coordinates |
