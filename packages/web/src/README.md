# src

## Overview

Source of `@video-player-ui/web`. The top-level directories are framework-independent browser code; [react](react) holds the React DOM player built on them.

## Components

| Component | Responsibility |
|-----------|----------------|
| [capture](capture) | Copying the frame on screen as an encoded image |
| [decoding](decoding) | MP4 structure parsing without the media data, and exact frame-by-frame WebCodecs decoding |
| [engine](engine) | `PlaybackEngine` implementation over `HTMLVideoElement` |
| [frame-table](frame-table) | Resolvers finding the presentation timestamps of a video's frames. Each resolver implements `FrameTableResolver` |
| [keyboard](keyboard) | Keyboard bindings of the player commands |
| [react](react) | React DOM player and its extension points |
| [source](source) | Video sources and reading their bytes |
| [surface](surface) | Canvas 2D implementation of `DrawingSurface` |
| [time-notation](time-notation) | Text forms of time: clock text formatting, and parsing of typed time ids and times |
