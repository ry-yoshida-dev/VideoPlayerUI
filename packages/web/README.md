# @video-player-ui/web

## Overview

Frame-accurate React DOM player built on `@video-player-ui/core`. The browser
decodes with its hardware decoders, `requestVideoFrameCallback` reports the
frame on screen, and the frame table is read from the MP4 sample table so
seeking and stepping land on exact frames. Videos may be URLs or `File`
objects picked by the user, so no server is needed.

It is built for inspecting footage rather than casual viewing: the control
bar sits below the video instead of over it and never hides, times show
milliseconds, and the seek bar previews the time id under the pointer.

Controls are icon-based: seek bar, play, 10 s back, 30 s forward, frame step,
frame copy, time, time id field, speed menu, mute, loop and full screen. The
time id field jumps on Enter to a typed time id (`123`) or time (`1:23.4`)
and hands focus back to the player. Keyboard: Space/K play, ←/J back, →/L
forward, `,`/`.` frame step, G time id field, C copy frame, M mute, F full
screen.

Hovering a control shows what it does and its key. Extensions get the same
tooltip by setting `data-vpui-tooltip` on any element inside the player.

Frame copy puts the frame on screen on the clipboard as a PNG at the video's
own resolution, without overlays. Applications get the same image as a `Blob`
from `usePlayerContext().captureFrame()` or `new FrameCapture(video).toBlob()`.

The player draws nothing over the video by itself. Children extend it:

| Extension point | Purpose |
|-----------------|---------|
| `FrameCanvas` | Draw anything once per frame on screen, with pointer input in frame coordinates |
| `PlayerControlSlot` | Add controls to the control bar |
| `usePlayerShortcut` | Bind keys |
| `usePlayerContext().showFeedback` | Flash a glyph in the middle of the player |
| `usePlayerController` | Drive playback |
| `usePlayerContext().captureFrame` | Get the frame on screen as an image `Blob` |
| `usePlayerContext().capturePresentedFrame` | Get the frame on screen with its time id, guaranteed to match during playback |
| `useStableValue` | Keep inline option objects referentially stable while their content is unchanged |

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/react](src/react) | `VideoPlayer`, extension points (`FrameCanvas`, `PlayerControlSlot`, hooks), styles, labels and keyboard shortcuts |
| [src/react/controls](src/react/controls) | Control bar, seek bar, time id field, speed menu, copy button and icon button |
| [src/react/icons](src/react/icons) | SVG glyphs of the controls |
| [src/engine](src/engine) | `HtmlVideoPlaybackEngine` over `HTMLVideoElement` |
| [src/frame-table](src/frame-table) | Frame table resolvers: MP4 sample table, constant frame rate, fallback chain |
| [src/surface](src/surface) | `CanvasDrawingSurface`, the Canvas 2D `DrawingSurface` |
| [src/capture](src/capture) | `FrameCapture`: frame on screen or any image, encoded to a `Blob` or the clipboard |
| [src/decoding](src/decoding) | `Mp4MetadataReader`, `Mp4SampleTable` and `SequentialFrameDecoder`: MP4 structure parsing without the media data, and exact frame-by-frame WebCodecs decoding |
| [src/source](src/source) | Video sources, `CrossOrigin` modes and byte range reading of URLs and files |
| [test](test) | MP4 parsing (plain, movie header at the end, fragmented), byte range reading, WebCodecs decoder (against fake codecs) and frame table resolver tests |

## Examples

```tsx
<VideoPlayer
  source={file}
  timeline={{ indexBase: IndexBase.ONE, samplingFrequency: 5 }}
  framesPerSecond={30}
  labels={{ play: "再生", pause: "一時停止" }}
  style={{ width: "100%", aspectRatio: "16 / 9" }}
>
  <CenterGuide />
</VideoPlayer>
```

An extension drawing a guide over every frame and adding a control:

```tsx
function CenterGuide() {
  const [isVisible, setIsVisible] = useState(true);
  const draw = useCallback(({ surface, transform }: FrameDrawContext) => {
    if (isVisible) {
      surface.fillCircle(transform.toView({ x: 0.5, y: 0.5 }), 4, "#ff0");
    }
  }, [isVisible]);
  usePlayerShortcut("g", () => setIsVisible((value) => !value));
  return (
    <>
      <FrameCanvas draw={draw} />
      <PlayerControlSlot>
        <IconButton label="Guide (G)" isPressed={isVisible} onClick={() => setIsVisible(!isVisible)}>
          <Icon name={IconName.LAYERS} />
        </IconButton>
      </PlayerControlSlot>
    </>
  );
}
```

## Supported sources

| Source | Frame table | Notes |
|--------|-------------|-------|
| MP4 / MOV, movie header in front or at the end | Exact | Only the container structure is read; media data is skipped with range requests |
| Fragmented MP4 | Exact | Every fragment header is read; over HTTP that is one request per fragment |
| WebM, MKV and other containers the browser plays | `framesPerSecond` | Constant frame rate assumed, or pass a custom `frameTableResolver` |
| HLS / DASH | Not supported | |

URLs on another origin play with the default `crossOrigin` of
`CrossOrigin.NONE`, but reading their frame table and their frames (frame
copy, capture, live analysis) needs CORS. Pass
`crossOrigin={CrossOrigin.ANONYMOUS}`, or `CrossOrigin.USE_CREDENTIALS` for
cookie-authenticated media, and have the server send
`Access-Control-Allow-Origin` and allow the `Range` header:

```tsx
<VideoPlayer source="https://cdn.example.com/run-42.mp4" crossOrigin={CrossOrigin.ANONYMOUS} />
```

Servers without range support are downloaded whole once to read the frame
table; seeking in the browser needs range support anyway.
