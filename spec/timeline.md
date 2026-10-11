# Timeline

The timeline maps the frames a player decodes onto the **time ids** that
annotations and application code refer to. Its rules are those of
[TimeSeriesIterator](https://github.com/ry-yoshida-dev/TimeSeriesIterator), so
time ids produced by a Python pipeline address the same frames in every player
implementation.

## Stored Media

A media source holds `N >= 1` stored frames with zero-based **media indices**
`i = 0 … N-1`. Each stored frame has a presentation timestamp `pts(i)` in
seconds, strictly increasing in `i`. The timestamps come from the container's
sample table when available, so variable frame rate media resolves correctly.
A constant frame rate `r` is the fallback: `pts(i) = i / r`.

## Parameters

| Name | Default | Meaning |
|------|---------|---------|
| `indexBase` | `1` | Time id of the first raw frame (`0` or `1`). |
| `preSampledFrequency` (`P`) | `1` | Raw frames per stored frame. |
| `samplingFrequency` (`S`) | `1` | Stored frames per sampled step. |
| `startTimeId` | `indexBase` | First time id of the range. |
| `endTimeId` | `null` | Last time id of the range; `null` runs to the last frame. Python's `-1` maps to `null`. |

Validation fails fast with the same rules as `TimeSeriesIterationParameters`:

- `P >= 1` and `S >= 1` are integers.
- `startTimeId >= indexBase`.
- `(startTimeId - indexBase) % P == 0`.
- `endTimeId` is `null` or `endTimeId >= max(startTimeId, 1)`.

## Derived Values

```
timeId(i)          = indexBase + i * P
mediaIndex(t)      = (t - indexBase) / P          valid only when t is on the grid
mediaLastTimeId    = indexBase + (N - 1) * P
rangeStartTimeId   = startTimeId
rangeEndTimeId     = min(endTimeId, mediaLastTimeId)   or mediaLastTimeId when null
step               = S * P
sampledTimeIds     = rangeStartTimeId + k * step  for k >= 0, while <= rangeEndTimeId
sampledStepCount   = (rangeEndTimeId - rangeStartTimeId) // step + 1, or 0 when negative
```

`mediaIndex(t)` rejects `t < indexBase`, `t > mediaLastTimeId`, and ids off the
pre-sampled grid, matching `TimeSeriesIterator.media_index_of`.

## Clock Resolution

A player reports the presentation time `s` of the frame on screen. The frame
shown is the last stored frame starting at or before `s`:

```
frameAt(s) = max { i : pts(i) <= s + tolerance }   clamped to 0
```

`tolerance` is one millisecond and absorbs rounding in platform clocks.

To display frame `i`, a player seeks to the middle of its display interval,
`(pts(i) + pts(i + 1)) / 2`, or `pts(i)` plus half the mean frame interval for
the last frame. Seeking to the middle keeps decoders that round timestamps on
the intended frame.

## Playback Range

Playback, seeking and stepping stay inside `[rangeStartTimeId, rangeEndTimeId]`.
Stepping moves along `sampledTimeIds`. Continuous playback shows every stored
frame in the range, so the displayed time id may lie between two sampled ids.

## Conformance

[conformance/timeline.json](conformance/timeline.json) holds cases generated
from the Python implementation by
[conformance/generate_timeline_cases.py](conformance/generate_timeline_cases.py).
Every implementation runs them in its test suite.
