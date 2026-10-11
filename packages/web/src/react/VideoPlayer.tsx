import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from "react";
import { ContentFit, PlaybackState, PlayerController } from "@video-player-ui/core";
import type { PlayerSnapshot, PresentedFrame, Unsubscribe } from "@video-player-ui/core";

import { CenterIndicator } from "./CenterIndicator.js";
import { FrameCapture } from "../capture/FrameCapture.js";
import type { CapturedFrame } from "../capture/CapturedFrame.js";
import type { FrameCaptureOptions } from "../capture/FrameCaptureOptions.js";
import type { CopyNotice } from "./controls/CopyNotice.js";
import { CopyStatus } from "./controls/CopyStatus.js";
import { CrossOrigin } from "../source/CrossOrigin.js";
import { PlayerControls } from "./controls/PlayerControls.js";
import { defaultPlayerLabels } from "./defaultPlayerLabels.js";
import type { Feedback } from "./Feedback.js";
import type { FullscreenState } from "./FullscreenState.js";
import { Icon } from "./icons/Icon.js";
import { IconName } from "./icons/IconName.js";
import { SkipDirection } from "./icons/SkipDirection.js";
import { SkipIcon } from "./icons/SkipIcon.js";
import { KeyboardShortcuts } from "./KeyboardShortcuts.js";
import { PlayerAction } from "./PlayerAction.js";
import { PlayerContext } from "./PlayerContext.js";
import type { PlayerContextValue } from "./PlayerContextValue.js";
import type { PlayerLabels } from "./PlayerLabels.js";
import { PlayerStyles } from "./PlayerStyles.js";
import { TimeFormatter } from "./TimeFormatter.js";
import { TooltipLayer } from "./TooltipLayer.js";
import { useFullscreen } from "./useFullscreen.js";
import { useHtmlVideoPlayer } from "./useHtmlVideoPlayer.js";
import { useOptionalPlayerSnapshot } from "./useOptionalPlayerSnapshot.js";
import type { VideoPlayerProps } from "./VideoPlayerProps.js";

const FEEDBACK_ICON_SIZE: number = 32;
const timeFormatter: TimeFormatter = new TimeFormatter();
const defaultKeyboardShortcuts: KeyboardShortcuts = new KeyboardShortcuts();

/**
 * Frame-accurate video player for inspecting footage: the video stays
 * uncovered, and the control bar below it offers a seek bar with time ids,
 * play, skip back and forward, frame step, frame copy, a time id field that
 * jumps on Enter, speed, mute, loop and full screen.
 *
 * Plays URLs and local files without a server and seeks to exact frames.
 * It draws nothing over the video by itself; children such as
 * {@link FrameCanvas} or `AnnotationLayer` add overlays, controls and
 * shortcuts through {@link usePlayerContext}.
 *
 * @param props - Source, timeline and presentation options.
 * @returns The player element.
 */
export function VideoPlayer(props: VideoPlayerProps): ReactElement {
  const contentFit: ContentFit = props.contentFit ?? ContentFit.CONTAIN;
  const crossOrigin: CrossOrigin = props.crossOrigin ?? CrossOrigin.NONE;
  const skipBackwardSeconds: number = props.skipBackwardSeconds ?? 10;
  const skipForwardSeconds: number = props.skipForwardSeconds ?? 30;
  const keyboardShortcuts: KeyboardShortcuts | null =
    props.keyboardShortcuts === undefined ? defaultKeyboardShortcuts : props.keyboardShortcuts;

  const rootRef: { current: HTMLDivElement | null } = useRef<HTMLDivElement | null>(null);
  const timeIdInputRef: { current: HTMLInputElement | null } = useRef<HTMLInputElement | null>(null);
  const extensionShortcutsRef: { current: Map<string, () => void> } = useRef<Map<string, () => void>>(new Map());
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const attachRoot: (element: HTMLDivElement | null) => void = useCallback((element: HTMLDivElement | null): void => {
    rootRef.current = element;
    setRoot(element);
  }, []);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [controlSlot, setControlSlot] = useState<HTMLElement | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [copyNotice, setCopyNotice] = useState<CopyNotice | null>(null);

  const controller: PlayerController | null = useHtmlVideoPlayer(video, props);
  const snapshot: PlayerSnapshot | null = useOptionalPlayerSnapshot(controller);
  const fullscreen: FullscreenState = useFullscreen(rootRef);
  const isPlaying: boolean = snapshot?.state === PlaybackState.PLAYING;
  useImperativeHandle<PlayerController | null, PlayerController | null>(props.ref, (): PlayerController | null => controller, [controller]);

  const stageAspectRatio: string | undefined =
    snapshot?.mediaInfo === null || snapshot === null
      ? undefined
      : `${snapshot.mediaInfo.frameSize.width} / ${snapshot.mediaInfo.frameSize.height}`;
  const labels: PlayerLabels = useMemo((): PlayerLabels => ({ ...defaultPlayerLabels, ...props.labels }), [props.labels]);

  const showFeedback: (content: ReactNode) => void = useCallback((content: ReactNode): void => {
    setFeedback((previous: Feedback | null) => ({ content, serial: (previous?.serial ?? 0) + 1 }));
  }, []);

  const registerShortcut: (key: string, handler: () => void) => Unsubscribe = useCallback(
    (key: string, handler: () => void): Unsubscribe => {
      extensionShortcutsRef.current.set(key, handler);
      return () => {
        if (extensionShortcutsRef.current.get(key) === handler) {
          extensionShortcutsRef.current.delete(key);
        }
      };
    },
    [],
  );

  const captureFrame: (options?: FrameCaptureOptions) => Promise<Blob> = useCallback(
    (options?: FrameCaptureOptions): Promise<Blob> =>
      video === null ? Promise.reject(new Error("The video element is not mounted")) : new FrameCapture(video).toBlob(options),
    [video],
  );

  const capturePresentedFrame: (options?: FrameCaptureOptions) => Promise<CapturedFrame> = useCallback(
    async (options?: FrameCaptureOptions): Promise<CapturedFrame> => {
      if (video === null || controller === null) {
        throw new Error("The player is not loaded");
      }
      const frame: PresentedFrame = await controller.settledFrame();
      const blob: Blob = await new FrameCapture(video).toBlob(options);
      return { timeId: frame.timeId, blob, width: video.videoWidth, height: video.videoHeight };
    },
    [video, controller],
  );

  const copyFrame: () => void = useCallback((): void => {
    if (video === null) {
      return;
    }
    const notify: (status: CopyStatus) => void = (status: CopyStatus): void =>
      setCopyNotice((previous: CopyNotice | null) => ({ status, serial: (previous?.serial ?? 0) + 1 }));
    new FrameCapture(video)
      .copyToClipboard()
      .then(() => notify(CopyStatus.SUCCEEDED))
      .catch(() => notify(CopyStatus.FAILED));
  }, [video]);

  const contextValue: PlayerContextValue | null = useMemo(
    (): PlayerContextValue | null =>
      controller === null
        ? null
        : {
            controller,
            source: props.source,
            crossOrigin,
            contentFit,
            controlSlot,
            showFeedback,
            captureFrame,
            capturePresentedFrame,
            registerShortcut,
          },
    [controller, props.source, crossOrigin, contentFit, controlSlot, showFeedback, captureFrame, capturePresentedFrame, registerShortcut],
  );

  useEffect(() => {
    if (props.playbackRate !== undefined) {
      controller?.setPlaybackRate(props.playbackRate);
    }
  }, [controller, props.playbackRate]);
  useEffect(() => {
    if (props.isMuted !== undefined) {
      controller?.setMuted(props.isMuted);
    }
  }, [controller, props.isMuted]);
  useEffect(() => {
    if (props.isLooping !== undefined) {
      controller?.setLooping(props.isLooping);
    }
  }, [controller, props.isLooping]);

  const { onFrame, onError }: VideoPlayerProps = props;
  useEffect(() => {
    if (controller === null || onFrame === undefined) {
      return undefined;
    }
    return controller.subscribeFrame((frame: PresentedFrame) => onFrame(frame));
  }, [controller, onFrame]);
  const error: Error | null = snapshot?.error ?? null;
  useEffect(() => {
    if (error !== null) {
      onError?.(error);
    }
  }, [error, onError]);

  const runAction: (action: PlayerAction) => void = (action: PlayerAction): void => {
    if (controller === null || snapshot === null || snapshot.timeline === null) {
      return;
    }
    switch (action) {
      case PlayerAction.TOGGLE_PLAYBACK:
        showFeedback(<Icon name={isPlaying ? IconName.PAUSE : IconName.PLAY} size={FEEDBACK_ICON_SIZE} />);
        void controller.togglePlayback();
        return;
      case PlayerAction.SKIP_BACKWARD:
        showFeedback(<SkipIcon direction={SkipDirection.BACKWARD} seconds={skipBackwardSeconds} size={36} />);
        void controller.seekBy(-skipBackwardSeconds);
        return;
      case PlayerAction.SKIP_FORWARD:
        showFeedback(<SkipIcon direction={SkipDirection.FORWARD} seconds={skipForwardSeconds} size={36} />);
        void controller.seekBy(skipForwardSeconds);
        return;
      case PlayerAction.STEP_BACKWARD:
        void controller.stepBackward();
        return;
      case PlayerAction.STEP_FORWARD:
        void controller.stepForward();
        return;
      case PlayerAction.TOGGLE_MUTE:
        showFeedback(<Icon name={snapshot.isMuted ? IconName.VOLUME : IconName.VOLUME_MUTED} size={FEEDBACK_ICON_SIZE} />);
        controller.setMuted(!snapshot.isMuted);
        return;
      case PlayerAction.TOGGLE_FULLSCREEN:
        fullscreen.toggle();
        return;
      case PlayerAction.COPY_FRAME:
        copyFrame();
        return;
      case PlayerAction.FOCUS_TIME_ID:
        timeIdInputRef.current?.focus();
        return;
    }
  };

  const onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (keyboardShortcuts === null || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    const action: PlayerAction | null = keyboardShortcuts.actionFor(event);
    const key: string | null = KeyboardShortcuts.keyOf(event);
    const extensionHandler: (() => void) | undefined = key === null ? undefined : extensionShortcutsRef.current.get(key);
    if (action === null && extensionHandler === undefined) {
      return;
    }
    event.preventDefault();
    if (action !== null) {
      runAction(action);
    } else {
      extensionHandler?.();
    }
  };

  const onStageClick: (event: ReactMouseEvent<HTMLDivElement>) => void = (event: ReactMouseEvent<HTMLDivElement>): void => {
    const target: EventTarget = event.target;
    const isPlaybackSurface: boolean =
      target instanceof HTMLVideoElement || (target instanceof HTMLElement && target.dataset["vpuiSurface"] === "true");
    if (!isPlaybackSurface) {
      return;
    }
    runAction(PlayerAction.TOGGLE_PLAYBACK);
  };

  return (
    <div
      ref={attachRoot}
      className={props.className === undefined ? "vpui-root" : `vpui-root ${props.className}`}
      style={props.style}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <PlayerStyles />
      <div className="vpui-stage" style={{ aspectRatio: stageAspectRatio }} onClick={onStageClick}>
        <video ref={setVideo} className="vpui-video" style={{ objectFit: contentFit }} playsInline />
        {contextValue !== null && <PlayerContext value={contextValue}>{props.children}</PlayerContext>}
        <CenterIndicator snapshot={snapshot} feedback={feedback} onFeedbackEnd={() => setFeedback(null)} />
      </div>
      {controller !== null && snapshot !== null && snapshot.timeline !== null && props.isControlsVisible !== false && (
        <PlayerControls
          controller={controller}
          snapshot={snapshot}
          labels={labels}
          formatter={timeFormatter}
          playbackRates={props.playbackRates ?? PlayerController.STANDARD_PLAYBACK_RATES}
          skipBackwardSeconds={skipBackwardSeconds}
          skipForwardSeconds={skipForwardSeconds}
          isTimeIdVisible={props.isTimeIdVisible ?? true}
          timeIdInputRef={timeIdInputRef}
          onTimeIdFinish={() => rootRef.current?.focus()}
          onCopyFrame={copyFrame}
          copyNotice={copyNotice}
          onCopyNoticeEnd={() => setCopyNotice(null)}
          slotRef={setControlSlot}
          fullscreen={fullscreen}
        />
      )}
      <TooltipLayer root={root} />
    </div>
  );
}
