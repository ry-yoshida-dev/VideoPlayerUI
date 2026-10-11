import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerController } from "@video-player-ui/core";
import type { TimelineParametersInit } from "@video-player-ui/core";

import { HtmlVideoPlaybackEngine } from "../engine/HtmlVideoPlaybackEngine.js";
import { ConstantFrameRateResolver } from "../frame-table/ConstantFrameRateResolver.js";
import { FallbackFrameTableResolver } from "../frame-table/FallbackFrameTableResolver.js";
import type { FrameTableResolver } from "../frame-table/FrameTableResolver.js";
import { Mp4FrameTableResolver } from "../frame-table/Mp4FrameTableResolver.js";
import type { HtmlVideoPlayerOptions } from "./HtmlVideoPlayerOptions.js";
import { useStableValue } from "./useStableValue.js";

/**
 * Create, load and dispose a {@link PlayerController} over a video element.
 *
 * The controller is rebuilt when the element, source, timeline or frame
 * table resolution changes; the initial rate, mute and loop settings are
 * read only when it is built.
 *
 * @param video - Element to play in, or null before it mounts.
 * @param options - Source, timeline and initial settings.
 * @returns The controller, or null until the element mounts.
 */
export function useHtmlVideoPlayer(video: HTMLVideoElement | null, options: HtmlVideoPlayerOptions): PlayerController | null {
  const [controller, setController] = useState<PlayerController | null>(null);
  const optionsRef: { current: HtmlVideoPlayerOptions } = useRef<HtmlVideoPlayerOptions>(options);
  optionsRef.current = options;
  const { framesPerSecond, frameTableResolver: customResolver, source }: HtmlVideoPlayerOptions = options;
  const timeline: TimelineParametersInit = useStableValue<TimelineParametersInit>(options.timeline ?? {});

  const frameTableResolver: FrameTableResolver = useMemo(
    (): FrameTableResolver =>
      customResolver ??
      new FallbackFrameTableResolver([
        new Mp4FrameTableResolver(),
        ...(framesPerSecond === undefined ? [] : [new ConstantFrameRateResolver(framesPerSecond)]),
      ]),
    [customResolver, framesPerSecond],
  );

  useEffect(() => {
    if (video === null) {
      return undefined;
    }
    const initial: HtmlVideoPlayerOptions = optionsRef.current;
    const created: PlayerController = new PlayerController({
      engine: new HtmlVideoPlaybackEngine({ video, source, frameTableResolver }),
      timeline,
      playbackRate: initial.playbackRate ?? 1,
      isMuted: initial.isMuted ?? false,
      isLooping: initial.isLooping ?? false,
    });
    setController(created);
    created
      .load()
      .then(async () => {
        if (optionsRef.current.isAutoPlay === true) {
          await created.play();
        }
      })
      .catch(() => undefined);
    return () => {
      created.dispose();
    };
  }, [video, source, timeline, frameTableResolver]);

  return controller;
}
