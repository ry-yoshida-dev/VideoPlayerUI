# player

## Overview

`VideoPlayer`, its props and labels, and the context it offers to extensions.

## Components

| Component | Responsibility |
|-----------|----------------|
| [defaultPlayerLabels.ts](defaultPlayerLabels.ts) | English control names used when an application supplies none |
| [HtmlVideoPlayerOptions.ts](HtmlVideoPlayerOptions.ts) | Inputs of `useHtmlVideoPlayer` |
| [PlayerContext.ts](PlayerContext.ts) | Services of the enclosing `VideoPlayer`, available to its children once the player exists |
| [PlayerContextValue.ts](PlayerContextValue.ts) | What a `VideoPlayer` offers to the extensions rendered inside it |
| [PlayerLabels.ts](PlayerLabels.ts) | Accessible names of the controls, shown as tooltips; replace them to translate the UI |
| [VideoPlayer.tsx](VideoPlayer.tsx) | Frame-accurate player with the control bar below the video and extension points for its children |
| [VideoPlayerProps.ts](VideoPlayerProps.ts) | Props of `VideoPlayer` |
