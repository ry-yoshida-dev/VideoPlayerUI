# fixtures

## Overview

Small H.264 clips covering the MP4 layouts the frame table and decoder must handle.

## Components

| Component | Description |
|-----------|-------------|
| [bframes.mp4](bframes.mp4) | 12 frames at 10 fps with B-frames (decode order differs from presentation order), key frames every 6 frames and an edit list. |
| [moov-at-end.mp4](moov-at-end.mp4) | The same clip with the movie header after the media data. |
| [fragmented.mp4](fragmented.mp4) | The same samples in movie fragments, without an edit list, so its first frame shows at 0.2 s, as browsers report it. |

## Examples

Render the clips again with ffmpeg:

```bash
ffmpeg -f lavfi -i "testsrc2=size=64x48:rate=10" -frames:v 12 -c:v libx264 -preset veryfast -pix_fmt yuv420p \
  -x264-params "keyint=6:min-keyint=6:scenecut=0:bframes=2:b-adapt=0" -movflags +faststart bframes.mp4
ffmpeg -f lavfi -i "testsrc2=size=64x48:rate=10" -frames:v 12 -c:v libx264 -preset veryfast -pix_fmt yuv420p \
  -x264-params "keyint=6:min-keyint=6:scenecut=0:bframes=2:b-adapt=0" moov-at-end.mp4
ffmpeg -i moov-at-end.mp4 -c copy -movflags frag_keyframe+empty_moov fragmented.mp4
```
