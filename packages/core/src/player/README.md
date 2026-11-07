# player

## Overview

Playback state machine and the contract of the platform playback engine.

## Components

| Component | Responsibility |
|-----------|----------------|
| [MediaInfo.ts](MediaInfo.ts) | What a playback engine learns about its media while loading |
| [PlaybackEngine.ts](PlaybackEngine.ts) | Platform decoder and clock driven by a `PlayerController` |
| [PlaybackEngineEvents.ts](PlaybackEngineEvents.ts) | Callbacks through which a playback engine reports to its controller |
| [PlaybackState.ts](PlaybackState.ts) | Lifecycle state of a player |
| [PlayerController.ts](PlayerController.ts) | Platform-independent player: owns the state machine and the timeline, and drives a `PlaybackEngine` |
| [PlayerControllerOptions.ts](PlayerControllerOptions.ts) | Inputs of a `PlayerController` |
| [PlayerSnapshot.ts](PlayerSnapshot.ts) | Immutable view of a player's state; a new object is published on every change |
| [PlayerStateError.ts](PlayerStateError.ts) | Raised when a command needs a state the player is not in, such as seeking before loading |
| [PlayOutcome.ts](PlayOutcome.ts) | How a `PlaybackEngine.play` request settled |
| [PresentedFrame.ts](PresentedFrame.ts) | Frame currently on screen |
| [ReleaseHold.ts](ReleaseHold.ts) | Ends the hold a `PlayerController.hold` call placed |
