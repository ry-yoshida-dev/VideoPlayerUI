# extensions

## Overview

Components through which children of `VideoPlayer` draw on frames and add controls.

## Components

| Component | Responsibility |
|-----------|----------------|
| [FrameCanvas.tsx](FrameCanvas.tsx) | Canvas over the video redrawn once per frame on screen, for any frame-synchronized drawing |
| [FrameCanvasHandle.ts](FrameCanvasHandle.ts) | Imperative access to a `FrameCanvas` |
| [FrameCanvasProps.ts](FrameCanvasProps.ts) | Props of `FrameCanvas` |
| [FrameDrawContext.ts](FrameDrawContext.ts) | Inputs of one `FrameCanvas` redraw |
| [FramePointer.ts](FramePointer.ts) | Pointer position over a `FrameCanvas` |
| [PlayerControlSlot.tsx](PlayerControlSlot.tsx) | Places an extension's controls in the player's control bar, before the full screen button |
| [PlayerControlSlotProps.ts](PlayerControlSlotProps.ts) | Props of `PlayerControlSlot` |
