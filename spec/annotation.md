# Annotation Document

An annotation document carries the overlays for one media source as JSON. It is
validated by [annotation.schema.json](annotation.schema.json) and parsed by
`AnnotationDocumentParser` in `@video-player-ui/core`.

## Structure

```json
{
  "formatVersion": 1,
  "coordinateSpace": "normalized",
  "frames": [
    {
      "timeId": 1,
      "annotations": [
        {
          "kind": "bounding-box",
          "box": { "x": 0.12, "y": 0.30, "width": 0.20, "height": 0.45 },
          "label": "person",
          "score": 0.93,
          "trackId": 4
        }
      ]
    }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `formatVersion` | Always `1` for this revision. |
| `coordinateSpace` | `normalized` (default): coordinates in `[0, 1]` relative to the frame. `pixel`: coordinates in pixels of `frameSize`, normalized on load. |
| `frameSize` | `{ "width", "height" }` in pixels. Required when `coordinateSpace` is `pixel`. |
| `frames[].timeId` | Time id the annotations belong to (see [timeline.md](timeline.md)). |
| `frames[].annotations` | Annotations drawn on that frame. |

The origin is the top-left corner of the frame, `x` grows right and `y` grows
down.

## Common Annotation Fields

Every annotation has a `kind` and may carry:

| Field | Type | Meaning |
|-------|------|---------|
| `label` | string | Class name; drives the default color. |
| `score` | number | Confidence in `[0, 1]`. |
| `trackId` | integer or string | Identity across frames; takes precedence over `label` for color. |
| `color` | string | CSS color overriding the palette. |
| `attributes` | object | Free-form string, number or boolean values for application use. |

## Built-in Kinds

| `kind` | Fields |
|--------|--------|
| `bounding-box` | `box: { x, y, width, height }` |
| `polygon` | `points: [{ x, y }, …]` (at least 3), `isClosed` (default `true`) |
| `keypoints` | `points: [{ x, y, score? }, …]`, `edges: [[from, to], …]` (indices into `points`, optional) |

## Custom Kinds

Any other `kind` is accepted when the application registers an
`AnnotationPlugin` for it. The plugin parses the raw object and draws the
result, so a custom kind works on every platform the plugin's drawing commands
support. A document containing a kind without a registered plugin fails to
parse.
