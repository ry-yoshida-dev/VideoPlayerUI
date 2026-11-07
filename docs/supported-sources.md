# Supported sources

Sources [`@video-player-ui/web`](../packages/web/README.md) plays and how it reads their frame table.

| Source | Frame table | Notes |
|--------|-------------|-------|
| MP4 / MOV, movie header in front or at the end | Exact | Only the container structure is read; media data is skipped with range requests |
| Fragmented MP4 | Exact | Every fragment header is read; over HTTP that is one request per fragment |
| WebM, MKV and other containers the browser plays | `framesPerSecond` | Constant frame rate assumed, or pass a custom `frameTableResolver` |
| HLS / DASH | Not supported | |

- URLs on another origin play with the default `CrossOrigin.NONE`, but reading their frame table and frames (frame copy, capture, live analysis) needs CORS: pass `crossOrigin={CrossOrigin.ANONYMOUS}` (or `CrossOrigin.USE_CREDENTIALS`) and have the server send `Access-Control-Allow-Origin` and allow the `Range` header.
- Servers without range support are downloaded whole once to read the frame table.
