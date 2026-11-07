# hooks

## Overview

React hooks of the player, for applications and extensions.

## Components

| Component | Responsibility |
|-----------|----------------|
| [FullscreenState.ts](FullscreenState.ts) | Result of `useFullscreen` |
| [useFullscreen.ts](useFullscreen.ts) | Full screen state of an element |
| [useHtmlVideoPlayer.ts](useHtmlVideoPlayer.ts) | Create, load and dispose a `PlayerController` over a video element |
| [useOptionalPlayerSnapshot.ts](useOptionalPlayerSnapshot.ts) | Snapshot of a player that may not exist yet |
| [usePlayerContext.ts](usePlayerContext.ts) | Services of the enclosing `VideoPlayer` |
| [usePlayerController.ts](usePlayerController.ts) | Controller of the enclosing `VideoPlayer` |
| [usePlayerShortcut.ts](usePlayerShortcut.ts) | Bind a key of the enclosing `VideoPlayer` to a command while the component is mounted |
| [useStableValue.ts](useStableValue.ts) | Keeps one reference for a plain-data value until its JSON form changes |
