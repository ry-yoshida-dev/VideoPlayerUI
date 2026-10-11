# Analysis Protocol

Live analysis sends the frame on screen to an analysis server and draws the
returned annotations on that frame. Client and server talk over one WebSocket
connection; a client may send several requests before the first answer,
and the server answers them in any order.

## Request

A binary message:

```
┌──────────────────────┬──────────────────────┬─────────────────────┐
│ header length (4 B)  │ header (UTF-8 JSON)  │ encoded image bytes │
│ unsigned, big-endian │                      │                     │
└──────────────────────┴──────────────────────┴─────────────────────┘
```

```json
{
  "type": "analyze",
  "requestId": 17,
  "timeId": 123,
  "mimeType": "image/png",
  "width": 1920,
  "height": 1080
}
```

| Field | Meaning |
|-------|---------|
| `requestId` | Integer chosen by the client, echoed in the response. |
| `timeId` | Time id of the frame (see [timeline.md](timeline.md)). |
| `mimeType` | Encoding of the image bytes: `image/png`, `image/jpeg` or `image/webp`. |
| `width`, `height` | Frame size in pixels. |

## Response

A text message holding JSON. On success:

```json
{
  "type": "result",
  "requestId": 17,
  "timeId": 123,
  "coordinateSpace": "pixel",
  "frameSize": { "width": 1920, "height": 1080 },
  "annotations": [
    { "kind": "bounding-box", "box": { "x": 10, "y": 20, "width": 190, "height": 380 }, "label": "person", "score": 0.87 }
  ]
}
```

`annotations`, `coordinateSpace` and `frameSize` follow
[annotation.md](annotation.md); `coordinateSpace` defaults to `normalized`.

On failure:

```json
{ "type": "error", "requestId": 17, "message": "model not loaded" }
```

A failure ends that request only; the connection stays open.

A request the server cannot decode, such as a text message or a malformed
header, is answered with `requestId` `-1`, since its id is unknown. The client
fails every request still waiting for an answer, because any of them may be
the one that was rejected.
