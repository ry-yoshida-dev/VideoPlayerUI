# Test fixtures

## Overview

`bframes.mp4` is a 12-frame, 10 fps H.264 clip with B-frames (decode order
differs from presentation order), key frames every 6 frames and an edit list,
rendered with:

```bash
ffmpeg -f lavfi -i "testsrc2=size=64x48:rate=10" -frames:v 12 -c:v libx264 -preset veryfast -pix_fmt yuv420p \
  -x264-params "keyint=6:min-keyint=6:scenecut=0:bframes=2:b-adapt=0" -movflags +faststart bframes.mp4
```
