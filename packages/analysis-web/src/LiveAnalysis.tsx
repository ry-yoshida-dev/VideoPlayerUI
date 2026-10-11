import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";
import { AnalysisScheduler, AnalysisState } from "@video-player-ui/analysis";
import type { AnalysisRequest, AnalysisStatus, FrameCapturer } from "@video-player-ui/analysis";
import { StreamingAnnotationSource } from "@video-player-ui/annotations";
import type { AnnotationLookupOptions, OverlayLayer } from "@video-player-ui/annotations";
import { AnnotationLayer } from "@video-player-ui/annotations-web";
import { PlaybackState } from "@video-player-ui/core";
import type { MediaInfo, PresentedFrame, Size } from "@video-player-ui/core";
import { PlayerControlSlot, usePlayerContext, useStableValue } from "@video-player-ui/web";
import { ByteRangeReader, Mp4SampleTable, SequentialFrameDecoder } from "@video-player-ui/web";
import type { FrameCaptureOptions, PlayerContextValue } from "@video-player-ui/web";

import { AnalysisStatusChip } from "./AnalysisStatusChip.js";
import { analysisStyleSheet } from "./analysisStyleSheet.js";
import { defaultLiveAnalysisLabels } from "./defaultLiveAnalysisLabels.js";
import type { LiveAnalysisLabels } from "./LiveAnalysisLabels.js";
import type { LiveAnalysisProps } from "./LiveAnalysisProps.js";
import { DecodingLookahead } from "./DecodingLookahead.js";

const LAYER_ID: string = "live-analysis";
const IDLE_STATUS: AnalysisStatus = {
  state: AnalysisState.IDLE,
  inFlightTimeId: null,
  inFlightCount: 0,
  lastAnalyzedTimeId: null,
  lastLatencyMilliseconds: null,
  analyzedFrameCount: 0,
  error: null,
};

/**
 * Analyzes frames with a {@link FrameAnalyzer} and draws the results on the
 * frame they belong to, as a child of {@link VideoPlayer}.
 *
 * The video is decoded ahead of the playhead with WebCodecs and those frames
 * are sent at the pace the analyzer accepts them, so results are usually
 * ready before their frame is shown; decoded frames carry their own
 * timestamps, so results always belong to the frame analyzed. Paused and
 * stepped frames are always analyzed. Frames whose own result has not
 * arrived show the latest earlier result faded. Without WebCodecs or for
 * non-MP4 sources, the frame on screen is captured instead.
 *
 * @param props - Analyzer, encoding, look-ahead, drawing and labels.
 * @returns The overlay, the hidden look-ahead video and the status in the control bar.
 */
export function LiveAnalysis(props: LiveAnalysisProps): ReactElement {
  const { analyzer, encoding, quality }: LiveAnalysisProps = props;
  const lookaheadSeconds: number = props.lookaheadSeconds ?? 1;
  const maxInFlight: number = props.maxInFlight ?? 4;
  const { controller, source: videoSource, captureFrame }: PlayerContextValue = usePlayerContext();
  const [decoder, setDecoder] = useState<SequentialFrameDecoder | null>(null);
  const [displayedTimeId, setDisplayedTimeId] = useState<number | null>(null);
  const [scheduler, setScheduler] = useState<AnalysisScheduler | null>(null);
  const labels: LiveAnalysisLabels = { ...defaultLiveAnalysisLabels, ...props.labels };
  const lookup: AnnotationLookupOptions = useStableValue<AnnotationLookupOptions>(props.lookup ?? {});

  const resultSource: StreamingAnnotationSource = useMemo((): StreamingAnnotationSource => new StreamingAnnotationSource(lookup), [lookup]);
  const layers: readonly OverlayLayer[] = useMemo((): readonly OverlayLayer[] => [{ id: LAYER_ID, source: resultSource }], [resultSource]);
  const captureOptions: FrameCaptureOptions = useMemo(
    (): FrameCaptureOptions => ({
      ...(encoding === undefined ? {} : { encoding }),
      ...(quality === undefined ? {} : { quality }),
    }),
    [encoding, quality],
  );

  const captureOnScreen: (timeId: number) => FrameCapturer = useCallback(
    (timeId: number): FrameCapturer =>
      async (): Promise<AnalysisRequest> => {
        const mediaInfo: MediaInfo | null = controller.getSnapshot().mediaInfo;
        if (mediaInfo === null) {
          throw new Error("The media is not loaded");
        }
        const { width, height }: Size = mediaInfo.frameSize;
        const blob: Blob = await captureFrame(captureOptions);
        return { timeId, frame: { bytes: await blob.arrayBuffer(), mimeType: blob.type, width, height } };
      },
    [controller, captureFrame, captureOptions],
  );

  useEffect(() => {
    setDecoder(null);
    if (!SequentialFrameDecoder.isSupported()) {
      return undefined;
    }
    let isCurrent: boolean = true;
    Mp4SampleTable.read(videoSource)
      .then((table: Mp4SampleTable) => {
        if (isCurrent) {
          setDecoder(new SequentialFrameDecoder(table, new ByteRangeReader(videoSource)));
        }
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [videoSource]);

  useEffect(() => {
    const created: AnalysisScheduler = new AnalysisScheduler({ analyzer, source: resultSource, maxInFlight });
    setScheduler(created);
    const lookahead: DecodingLookahead | null =
      decoder === null
        ? null
        : new DecodingLookahead({
            decoder,
            controller,
            scheduler: created,
            leadSeconds: lookaheadSeconds,
            capture: captureOptions,
            onError: (error: Error): void => console.warn("Look-ahead decoding failed", error),
          });
    lookahead?.start();
    const unsubscribeFrames: () => void = controller.subscribeFrame((frame: PresentedFrame) => {
      setDisplayedTimeId(frame.timeId);
      lookahead?.notify();
      if (controller.getSnapshot().state !== PlaybackState.PLAYING) {
        created.request(frame.timeId, captureOnScreen(frame.timeId));
      } else if (lookahead === null) {
        created.offer(frame.timeId, captureOnScreen(frame.timeId));
      }
    });
    const unsubscribeState: () => void = controller.subscribe(() => lookahead?.notify());
    return () => {
      unsubscribeFrames();
      unsubscribeState();
      lookahead?.dispose();
      created.dispose();
      analyzer.close();
      resultSource.clear();
    };
  }, [analyzer, resultSource, maxInFlight, lookaheadSeconds, decoder, controller, captureOptions, captureOnScreen]);

  const subscribe: (listener: () => void) => () => void = useCallback(
    (listener: () => void): (() => void) => (scheduler === null ? () => undefined : scheduler.subscribe(listener)),
    [scheduler],
  );
  const getStatus: () => AnalysisStatus = useCallback(
    (): AnalysisStatus => (scheduler === null ? IDLE_STATUS : scheduler.getSnapshot()),
    [scheduler],
  );
  const status: AnalysisStatus = useSyncExternalStore(subscribe, getStatus, getStatus);

  return (
    <>
      <style href="video-player-ui-analysis" precedence="default">
        {analysisStyleSheet}
      </style>
      <AnnotationLayer
        layers={layers}
        {...(props.plugins === undefined ? {} : { plugins: props.plugins })}
        {...(props.theme === undefined ? {} : { theme: props.theme })}
        {...(props.onAnnotationClick === undefined ? {} : { onAnnotationClick: props.onAnnotationClick })}
        {...(props.layerLabels === undefined ? {} : { labels: props.layerLabels })}
      />
      {props.isStatusVisible !== false && (
        <PlayerControlSlot>
          <AnalysisStatusChip
            status={status}
            displayedTimeId={displayedTimeId}
            sourceTimeIdAt={(timeId: number) => resultSource.sourceTimeIdAt(timeId)}
            labels={labels}
          />
        </PlayerControlSlot>
      )}
    </>
  );
}
