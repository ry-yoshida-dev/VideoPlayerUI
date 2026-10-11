import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { PlaybackState } from "@video-player-ui/core";

import type { SeekBarProps } from "./SeekBarProps.js";

/**
 * Track showing the position in the range; click or drag to seek.
 *
 * Playback pauses while dragging and resumes on release, and the player
 * coalesces the seeks a drag produces.
 *
 * @param props - Player, snapshot and formatting.
 * @returns The slider element.
 */
export function SeekBar({ controller, snapshot, formatter, label }: SeekBarProps): ReactElement {
  const trackRef: { current: HTMLDivElement | null } = useRef<HTMLDivElement | null>(null);
  const wasPlayingRef: { current: boolean } = useRef<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const rangeSeconds: number = Math.max(snapshot.rangeEndSeconds - snapshot.rangeStartSeconds, Number.EPSILON);
  const positionRatio: number = Math.min(1, Math.max(0, (snapshot.presentationSeconds - snapshot.rangeStartSeconds) / rangeSeconds));
  const isLoaded: boolean = snapshot.timeline !== null;

  const ratioAt: (event: ReactPointerEvent<HTMLDivElement>) => number = (event: ReactPointerEvent<HTMLDivElement>): number => {
    const bounds: DOMRect = event.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
  };

  const seekTo: (ratio: number) => void = (ratio: number): void => {
    void controller.seekToSeconds(snapshot.rangeStartSeconds + ratio * rangeSeconds);
  };

  const onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!isLoaded || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    wasPlayingRef.current = snapshot.state === PlaybackState.PLAYING;
    if (wasPlayingRef.current) {
      controller.pause();
    }
    setIsScrubbing(true);
    seekTo(ratioAt(event));
  };

  const onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const ratio: number = ratioAt(event);
    setHoverRatio(ratio);
    if (isScrubbing) {
      seekTo(ratio);
    }
  };

  const onPointerEnd: (event: ReactPointerEvent<HTMLDivElement>) => void = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!isScrubbing) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsScrubbing(false);
    if (wasPlayingRef.current) {
      void controller.play();
    }
  };

  const tooltipRatio: number | null = isScrubbing ? positionRatio : hoverRatio;
  const tooltipSeconds: number | null = tooltipRatio === null ? null : snapshot.rangeStartSeconds + tooltipRatio * rangeSeconds;
  const tooltipTimeId: number | null =
    tooltipSeconds === null || snapshot.timeline === null || snapshot.mediaInfo === null
      ? null
      : snapshot.timeline.clampToRange(snapshot.timeline.timeIdOf(snapshot.mediaInfo.frameTable.indexAt(tooltipSeconds)));
  const elapsedText: string = formatter.format(snapshot.presentationSeconds - snapshot.rangeStartSeconds, rangeSeconds);

  return (
    <div
      ref={trackRef}
      className="vpui-seek"
      role="slider"
      tabIndex={-1}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(rangeSeconds)}
      aria-valuenow={Math.round(snapshot.presentationSeconds - snapshot.rangeStartSeconds)}
      aria-valuetext={elapsedText}
      data-scrubbing={isScrubbing}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={() => setHoverRatio(null)}
    >
      <div className="vpui-seek-track" />
      {hoverRatio !== null && <div className="vpui-seek-hover" style={{ width: `${hoverRatio * 100}%` }} />}
      <div className="vpui-seek-fill" style={{ width: `${positionRatio * 100}%` }} />
      <div className="vpui-seek-thumb" style={{ left: `${positionRatio * 100}%` }} />
      {tooltipRatio !== null && tooltipTimeId !== null && (
        <div className="vpui-seek-tooltip" style={{ left: `${tooltipRatio * 100}%` }}>
          {`#${tooltipTimeId} · ${formatter.format(tooltipRatio * rangeSeconds, rangeSeconds)}`}
        </div>
      )}
    </div>
  );
}
