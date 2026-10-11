import { useCallback } from "react";
import type { ReactElement } from "react";
import { PlaybackState } from "@video-player-ui/core";

import { Icon } from "../icons/Icon.js";
import { IconName } from "../icons/IconName.js";
import { SkipDirection } from "../icons/SkipDirection.js";
import { SkipIcon } from "../icons/SkipIcon.js";
import { CopyFrameButton } from "./CopyFrameButton.js";
import { IconButton } from "./IconButton.js";
import type { PlayerControlsProps } from "./PlayerControlsProps.js";
import { SeekBar } from "./SeekBar.js";
import { SpeedMenu } from "./SpeedMenu.js";
import { TimeIdField } from "./TimeIdField.js";

/**
 * Control bar below the video: seek bar, then play, skip, frame step, frame
 * copy, time, time id, speed, mute, loop, extension and full screen controls.
 *
 * @param props - Player, settings and callbacks.
 * @returns The control bar.
 */
export function PlayerControls(props: PlayerControlsProps): ReactElement {
  const { controller, snapshot, labels, formatter, fullscreen }: PlayerControlsProps = props;
  const isPlaying: boolean = snapshot.state === PlaybackState.PLAYING;
  const totalSeconds: number = snapshot.rangeEndSeconds - snapshot.rangeStartSeconds;
  const onSpeedSelect: (rate: number) => void = useCallback((rate: number): void => controller.setPlaybackRate(rate), [controller]);

  return (
    <div className="vpui-controls">
      <SeekBar controller={controller} snapshot={snapshot} formatter={formatter} label={labels.seek} />
      <div className="vpui-row">
        <IconButton label={isPlaying ? labels.pause : labels.play} isPrimary onClick={() => void controller.togglePlayback()}>
          <Icon name={isPlaying ? IconName.PAUSE : IconName.PLAY} size={26} />
        </IconButton>
        <IconButton
          label={labels.skipBackward(props.skipBackwardSeconds)}
          onClick={() => void controller.seekBy(-props.skipBackwardSeconds)}
        >
          <SkipIcon direction={SkipDirection.BACKWARD} seconds={props.skipBackwardSeconds} />
        </IconButton>
        <IconButton label={labels.skipForward(props.skipForwardSeconds)} onClick={() => void controller.seekBy(props.skipForwardSeconds)}>
          <SkipIcon direction={SkipDirection.FORWARD} seconds={props.skipForwardSeconds} />
        </IconButton>
        <IconButton label={labels.stepBackward} onClick={() => void controller.stepBackward()}>
          <Icon name={IconName.STEP_BACKWARD} size={20} />
        </IconButton>
        <IconButton label={labels.stepForward} onClick={() => void controller.stepForward()}>
          <Icon name={IconName.STEP_FORWARD} size={20} />
        </IconButton>
        <CopyFrameButton
          label={labels.copyFrame}
          copiedText={labels.copied}
          failedText={labels.copyFailed}
          notice={props.copyNotice}
          onCopy={props.onCopyFrame}
          onNoticeEnd={props.onCopyNoticeEnd}
        />
        <span className="vpui-time">
          {`${formatter.format(snapshot.presentationSeconds - snapshot.rangeStartSeconds, totalSeconds)} / ${formatter.format(totalSeconds)}`}
        </span>
        {props.isTimeIdVisible && (
          <TimeIdField
            controller={controller}
            snapshot={snapshot}
            label={labels.timeId}
            inputRef={props.timeIdInputRef}
            onFinish={props.onTimeIdFinish}
          />
        )}
        <span className="vpui-spacer" />
        <SpeedMenu
          playbackRate={snapshot.playbackRate}
          playbackRates={props.playbackRates}
          label={labels.playbackRate}
          onSelect={onSpeedSelect}
        />
        <IconButton
          label={snapshot.isMuted ? labels.unmute : labels.mute}
          isOptional
          onClick={() => controller.setMuted(!snapshot.isMuted)}
        >
          <Icon name={snapshot.isMuted ? IconName.VOLUME_MUTED : IconName.VOLUME} size={20} />
        </IconButton>
        <IconButton
          label={labels.loop}
          isOptional
          isPressed={snapshot.isLooping}
          onClick={() => controller.setLooping(!snapshot.isLooping)}
        >
          <Icon name={IconName.LOOP} size={20} />
        </IconButton>
        <span className="vpui-slot" ref={props.slotRef} />
        {fullscreen.isSupported && (
          <IconButton label={fullscreen.isFullscreen ? labels.exitFullscreen : labels.enterFullscreen} onClick={fullscreen.toggle}>
            <Icon name={fullscreen.isFullscreen ? IconName.FULLSCREEN_EXIT : IconName.FULLSCREEN} size={20} />
          </IconButton>
        )}
      </div>
    </div>
  );
}
