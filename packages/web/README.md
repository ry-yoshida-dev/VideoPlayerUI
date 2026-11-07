# @video-player-ui/web

## Overview

Frame-accurate React DOM player built on `@video-player-ui/core`. The browser decodes with its hardware decoders,
`requestVideoFrameCallback` reports the frame on screen, and the frame table is read from the MP4 sample table, so
seeking and stepping land on exact frames. Videos may be URLs or `File` objects picked by the user, so no server is
needed. The control bar sits below the video and never hides; children extend the player. See
[supported sources](../../docs/supported-sources.md) for the videos it plays.

## Components

| Component | Responsibility |
|-----------|----------------|
| [src/react/player](src/react/player) | `VideoPlayer`, its props and labels, and the context offered to extensions |
| [src/react/controls](src/react/controls) | Control bar, seek bar, time id field, speed menu, copy button and icon button |
| [src/react/extensions](src/react/extensions) | Extension points: `FrameCanvas` and `PlayerControlSlot` |
| [src/react/hooks](src/react/hooks) | `useHtmlVideoPlayer`, `usePlayerContext`, `usePlayerShortcut` and other hooks |
| [src/react/indicators](src/react/indicators) | Center glyph and tooltips shown over the player |
| [src/react/icons](src/react/icons) | SVG glyphs of the controls |
| [src/react/styles](src/react/styles) | Style sheet themed through `--vpui-*` custom properties |
| [src/engine](src/engine) | `HtmlVideoPlaybackEngine` over `HTMLVideoElement` |
| [src/frame-table](src/frame-table) | Frame table resolvers: MP4 sample table, constant frame rate, fallback chain |
| [src/surface](src/surface) | `CanvasDrawingSurface`, the Canvas 2D `DrawingSurface` |
| [src/capture](src/capture) | `FrameCapture`: frame on screen or any image, encoded to a `Blob` or the clipboard |
| [src/decoding](src/decoding) | `Mp4MetadataReader`, `Mp4SampleTable` and `SequentialFrameDecoder`: MP4 structure parsing without the media data, and exact frame-by-frame WebCodecs decoding |
| [src/source](src/source) | Video sources, `CrossOrigin` modes and byte range reading of URLs and files |
| [src/keyboard](src/keyboard) | `KeyboardShortcuts` and the `PlayerAction` commands they trigger |
| [src/time-notation](src/time-notation) | `TimeFormatter` and `SeekInputParser`: clock text and typed time ids |
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
