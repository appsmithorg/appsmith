import React, { useEffect, useState, useMemo, useRef } from "react";
import styled, { css, keyframes } from "styled-components";
import { Button, Icon } from "@blueprintjs/core";
import { useReactMediaRecorder } from "react-media-recorder";
import { useStopwatch } from "react-timer-hook";

import { ReactComponent as RecorderDefaultIcon } from "assets/icons/widget/recorder/recorder_default.svg";
import { ReactComponent as RecorderRecordingIcon } from "assets/icons/widget/recorder/recorder_recording.svg";
import { ReactComponent as RecorderPauseIcon } from "assets/icons/widget/recorder/recorder_pause.svg";
import { ReactComponent as RecorderCompleteIcon } from "assets/icons/widget/recorder/recorder_complete.svg";
import { ReactComponent as RecorderNoPermissionIcon } from "assets/icons/widget/recorder/recorder_no_permission.svg";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { hexToRgb, ThemeProp } from "components/ads/common";
import { darkenHover } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

export enum RecorderStatusTypes {
  PERMISSION_PROMPT = "PERMISSION_PROMPT",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  DEFAULT = "DEFAULT",
  RECORDING = "RECORDING",
  PAUSE = "PAUSE",
  COMPLETE = "COMPLETE",
  SAVED = "SAVED",
}

export type RecorderStatus = keyof typeof RecorderStatusTypes;

export enum PlayerStatusTypes {
  DEFAULT = "DEFAULT",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
}

export type PlayerStatus = keyof typeof PlayerStatusTypes;

const RecorderContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const RightContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  padding-left: 8%;

  & > .controls {
    display: flex;
    align-items: center;
    button {
      margin-left: 5%;
      border: none;
    }
  }
`;

const TimerContainer = styled.div<ThemeProp>`
  color: ${Colors.GREY_4};
`;

interface RecorderLeftButtonStyleProps {
  backgroundColor: string;
  dimension: number;
  disabled: boolean;
  iconColor: string;
  permissionDenied: boolean;
  status: RecorderStatus;
}

const getRgbaColor = (color: string, alpha: number) => {
  const rgb = hexToRgb(color);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const pulse = (boxShadowColor: string, dimension: number) => {
  return keyframes`
  0% {
    box-shadow: 0 0 0 0px ${getRgbaColor(boxShadowColor, 0.4)};
  }
  100% {
    box-shadow: 0 0 0 ${dimension * 0.1}px rgba(0, 0, 0, 0);
  }
`;
};

const animation = (props: RecorderLeftButtonStyleProps) => css`
  ${pulse(props.backgroundColor, props.dimension)} 2s infinite
`;

const StyledRecorderLeftButton = styled(Button)<
  ThemeProp & RecorderLeftButtonStyleProps
>`
  background-image: none !important;
  border-radius: 50%;
  height: ${({ dimension }) => dimension * 0.8}px;
  width: ${({ dimension }) => dimension * 0.8}px;

  box-shadow: ${({ backgroundColor, status }) =>
    status === RecorderStatusTypes.RECORDING
      ? `
      0 0 0 1px 1px ${getRgbaColor(backgroundColor, 0.4)}
    `
      : "none"} !important;
  margin-left: ${({ dimension }) => dimension * 0.1}px;

  animation: ${animation};

  & > svg {
    flex: 1;
    height: ${({ status }) =>
      status === RecorderStatusTypes.DEFAULT ||
      status === RecorderStatusTypes.SAVED
        ? "50%"
        : "40%"};
    path {
      ${({ iconColor }) =>
        iconColor &&
        `
        fill: ${iconColor};
      `}
    }
    circle {
      ${({ iconColor }) =>
        iconColor &&
        `
        fill: ${iconColor};
      `}
    }
  }

  ${({ backgroundColor, permissionDenied, theme }) => `
    &:enabled {
      background: ${
        backgroundColor
          ? permissionDenied
            ? theme.colors.button.disabled.bgColor
            : backgroundColor
          : "none"
      } !important;
    }
    &:hover:enabled, &:active:enabled {
      background: ${darkenHover(
        permissionDenied
          ? theme.colors.button.disabled.bgColor
          : backgroundColor || "#f6f6f6",
      )} !important;
      animation: none;
    }
    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
      > svg {
        path, circle {
          fill: ${theme.colors.button.disabled.textColor};
        }
      } 
    }
  `}
`;

const renderRecorderIcon = (
  denied = false,
  recorderStatus: RecorderStatus = RecorderStatusTypes.DEFAULT,
) => {
  if (denied) {
    return <RecorderNoPermissionIcon />;
  }

  switch (recorderStatus) {
    case RecorderStatusTypes.COMPLETE:
      return <RecorderCompleteIcon />;

    case RecorderStatusTypes.PAUSE:
      return <RecorderPauseIcon />;

    case RecorderStatusTypes.RECORDING:
      return <RecorderRecordingIcon />;

    default:
      return <RecorderDefaultIcon />;
  }
};

interface RecorderLeftProps {
  backgroundColor: string;
  dimension: number;
  disabled: boolean;
  iconColor: string;
  denied: boolean;
  status: RecorderStatus;
  onClick: () => void;
}

function RecorderLeft(props: RecorderLeftProps) {
  const {
    backgroundColor,
    denied,
    dimension,
    disabled,
    iconColor,
    onClick,
    status,
  } = props;

  const handleClick = () => {
    onClick();
  };

  return (
    <StyledRecorderLeftButton
      backgroundColor={backgroundColor}
      dimension={dimension}
      disabled={disabled || denied}
      icon={renderRecorderIcon(denied, status)}
      iconColor={iconColor}
      onClick={handleClick}
      permissionDenied={denied}
      status={status}
    />
  );
}

export enum PlayerButtonIntentTypes {
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  STOP = "STOP",
  CLEAR = "CLEAR",
}

export type PlayerButtonIntent = keyof typeof PlayerButtonIntentTypes;

export interface PlayerButtonProps {
  intent: PlayerButtonIntent;
  onClick: () => void;
}

function PlayerButton(props: PlayerButtonProps) {
  const { intent, onClick } = props;

  switch (intent) {
    case PlayerButtonIntentTypes.PLAY:
      return (
        <Button
          icon={<Icon icon="play" iconSize={20} />}
          minimal
          onClick={onClick}
          outlined
          small
          title="play"
        />
      );

    case PlayerButtonIntentTypes.PAUSE:
      return (
        <Button
          icon={<Icon icon="pause" iconSize={20} />}
          minimal
          onClick={onClick}
          outlined
          small
          title="pause"
        />
      );

    case PlayerButtonIntentTypes.STOP:
      return (
        <Button
          icon={<Icon icon="symbol-square" iconSize={20} />}
          minimal
          onClick={onClick}
          outlined
          small
          title="stop"
        />
      );

    default:
      return (
        <Button
          icon={<Icon color="#F22B2B" icon="small-cross" iconSize={20} />}
          minimal
          onClick={onClick}
          outlined
          small
          title="discard"
        />
      );
  }
}

interface RecorderRightProps {
  blobUrl: string | null;
  playerStatus: PlayerStatus;
  recorderStatus: RecorderStatus;
  onStopRecording: () => void;
  onClearBlobUrl: () => void;
  onBlobChanged: (blobUrl?: string, blob?: Blob) => void;
  onClearRecording: () => void;
  onPausePlayer: () => void;
  onPlayPlayer: () => void;
  onStopPlayer: () => void;
  onPlayerEnded: () => void;
  statusMessage: string;
  isClear: boolean;
  isReadyPlayerTimer: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function RecorderRight(props: RecorderRightProps) {
  const {
    blobUrl,
    days,
    hours,
    isClear,
    isReadyPlayerTimer,
    minutes,
    onBlobChanged,
    onClearBlobUrl,
    onClearRecording,
    onPlayerEnded,
    playerStatus,
    recorderStatus,
    seconds,
    statusMessage,
  } = props;

  const audioRef = useRef<HTMLAudioElement>(new Audio(blobUrl || undefined));

  const [currentDays, setCurrentDays] = useState(0);
  const [currentHours, setCurrentHours] = useState(0);
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);

  useEffect(() => {
    audioRef.current = new Audio(blobUrl || undefined);

    audioRef.current.removeEventListener("ended", handlePlayerEnded);
    audioRef.current.addEventListener("ended", handlePlayerEnded);
    audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audioRef.current.removeEventListener("ended", handlePlayerEnded);
      audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [blobUrl]);

  useEffect(() => {
    switch (playerStatus) {
      case PlayerStatusTypes.PLAY:
        audioRef.current.play();
        break;
      case PlayerStatusTypes.PAUSE:
        audioRef.current.pause();
        break;

      default:
        audioRef.current.pause();
        break;
    }
  }, [playerStatus]);

  useEffect(() => {
    if (!isReadyPlayerTimer) {
      setCurrentDays(0);
      setCurrentHours(0);
      setCurrentMinutes(0);
      setCurrentSeconds(0);
    }
  }, [isReadyPlayerTimer]);

  useEffect(() => {
    if (isClear) {
      onClearBlobUrl();
      onBlobChanged();
    }
  }, [isClear]);

  const renderPlayerControls = (props: RecorderRightProps) => {
    const {
      onPausePlayer,
      onPlayPlayer,
      onStopRecording,
      playerStatus,
      recorderStatus,
    } = props;

    switch (recorderStatus) {
      case RecorderStatusTypes.RECORDING:
      case RecorderStatusTypes.PAUSE:
        return (
          <>
            <PlayerButton
              intent={PlayerButtonIntentTypes.STOP}
              onClick={onStopRecording}
            />
            <PlayerButton
              intent={PlayerButtonIntentTypes.CLEAR}
              onClick={handleClear}
            />
          </>
        );

      case RecorderStatusTypes.COMPLETE:
        switch (playerStatus) {
          case PlayerStatusTypes.PLAY:
            return (
              <>
                <PlayerButton
                  intent={PlayerButtonIntentTypes.PAUSE}
                  onClick={onPausePlayer}
                />
                <PlayerButton
                  intent={PlayerButtonIntentTypes.CLEAR}
                  onClick={handleClear}
                />
              </>
            );

          default:
            return (
              <>
                <PlayerButton
                  intent={PlayerButtonIntentTypes.PLAY}
                  onClick={onPlayPlayer}
                />
                <PlayerButton
                  intent={PlayerButtonIntentTypes.CLEAR}
                  onClick={handleClear}
                />
              </>
            );
        }

      case RecorderStatusTypes.SAVED:
        switch (playerStatus) {
          case PlayerStatusTypes.PLAY:
            return (
              <PlayerButton
                intent={PlayerButtonIntentTypes.PAUSE}
                onClick={onPausePlayer}
              />
            );

          case PlayerStatusTypes.PAUSE:
          default:
            return (
              <PlayerButton
                intent={PlayerButtonIntentTypes.PLAY}
                onClick={onPlayPlayer}
              />
            );
        }

      default:
        return null;
    }
  };

  const handlePlayerEnded = () => {
    onPlayerEnded();
  };

  const handleTimeUpdate = () => {
    const totalSeconds = Math.ceil(audioRef.current.currentTime);
    setCurrentDays(Math.floor(totalSeconds / (60 * 60 * 24)));
    setCurrentHours(Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60)));
    setCurrentMinutes(Math.floor((totalSeconds % (60 * 60)) / 60));
    setCurrentSeconds(Math.floor(totalSeconds % 60));
  };

  const handleClear = () => {
    onClearRecording();
    setCurrentDays(0);
    setCurrentHours(0);
    setCurrentMinutes(0);
    setCurrentSeconds(0);
  };

  const getFormattedDigit = (value: number) => {
    return value >= 10 ? value.toString() : `0${value.toString()}`;
  };

  const renderTimer = (
    days: number,
    hours: number,
    minutes: number,
    seconds: number,
  ) => {
    return (
      <TimerContainer>
        {!!days && <span>{`${getFormattedDigit(days)}:`}</span>}
        {!!hours && <span>{`${getFormattedDigit(hours)}:`}</span>}
        <span>{`${getFormattedDigit(minutes)}:`}</span>
        <span>{`${getFormattedDigit(seconds)}`}</span>
      </TimerContainer>
    );
  };

  return (
    <RightContainer>
      <div className="status">{statusMessage}</div>
      {recorderStatus === RecorderStatusTypes.PERMISSION_DENIED ? (
        <a
          href="https://help.sprucehealth.com/article/386-changing-permissions-for-video-and-audio-on-your-internet-browser"
          rel="noreferrer"
          target="_blank"
        >
          Know more
        </a>
      ) : (
        <div className="controls">
          {isReadyPlayerTimer
            ? renderTimer(
                currentDays,
                currentHours,
                currentMinutes,
                currentSeconds,
              )
            : renderTimer(days, hours, minutes, seconds)}
          {renderPlayerControls(props)}
        </div>
      )}
    </RightContainer>
  );
}

export interface RecorderComponentProps {
  backgroundColor: string;
  height: number;
  iconColor: string;
  isDisabled: boolean;
  onRecordingStart: () => void;
  onRecordingComplete: (blobUrl?: string, blob?: Blob) => void;
  blobUrl?: string;
  width: number;
}

function AudioRecorderComponent(props: RecorderComponentProps) {
  const {
    backgroundColor,
    blobUrl,
    height,
    iconColor,
    isDisabled,
    onRecordingComplete,
    onRecordingStart,
    width,
  } = props;

  const recorderContainerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(
    width - WIDGET_PADDING * 2,
  );
  const [recorderStatus, setRecorderStatus] = useState(
    RecorderStatusTypes.PERMISSION_PROMPT,
  );
  const [playerStatus, setPlayerStatus] = useState(PlayerStatusTypes.DEFAULT);
  const [statusMessage, setStatusMessage] = useState("Press to get permission");

  const [isReadyPlayerTimer, setIsReadyPlayerTimer] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const {
    clearBlobUrl,
    error,
    mediaBlobUrl,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useReactMediaRecorder({
    onStop: (blobUrl: string, blob: Blob) => onRecordingComplete(blobUrl, blob),
  });

  const { days, hours, minutes, pause, reset, seconds, start } = useStopwatch({
    autoStart: false,
  });

  useEffect(() => {
    const recorderContainerElement = recorderContainerRef.current;
    if (recorderContainerElement) {
      setContainerWidth(recorderContainerElement.clientWidth);
    }
  }, [width, height]);

  useEffect(() => {
    if (error === "permission_denied") {
      setIsPermissionDenied(true);
      setRecorderStatus(RecorderStatusTypes.PERMISSION_DENIED);
      setStatusMessage("Permission denied");
    }
  }, [error]);

  useEffect(() => {
    if (
      recorderStatus !== RecorderStatusTypes.PERMISSION_PROMPT &&
      recorderStatus !== RecorderStatusTypes.DEFAULT &&
      blobUrl === undefined
    ) {
      resetRecorder();
    }
  }, [blobUrl]);

  const dimension = useMemo(() => {
    if (containerWidth > height) {
      return height - WIDGET_PADDING * 2;
    }

    return containerWidth;
  }, [containerWidth, height, width]);

  const resetRecorder = () => {
    setRecorderStatus(RecorderStatusTypes.DEFAULT);
    setStatusMessage("Press to start recording");
    setIsClear(true);
    setIsReadyPlayerTimer(false);
    reset(0, false);
  };

  const handlePermissionPrompt = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then(() => {
        setIsPermissionDenied(false);
        setRecorderStatus(RecorderStatusTypes.DEFAULT);
        setStatusMessage("Press to start recording");
      })
      .catch((err) => {
        if (err.code === 0) {
          setIsPermissionDenied(true);
          setRecorderStatus(RecorderStatusTypes.PERMISSION_DENIED);
          setStatusMessage("Permission denied");
        }
      });
  };

  const handleRecorderClick = () => {
    switch (recorderStatus) {
      case RecorderStatusTypes.DEFAULT:
        startRecording();
        start();
        setRecorderStatus(RecorderStatusTypes.RECORDING);
        setStatusMessage("Recording...");
        setIsClear(false);
        onRecordingStart();
        break;
      case RecorderStatusTypes.RECORDING:
        pauseRecording();
        pause();
        setRecorderStatus(RecorderStatusTypes.PAUSE);
        setStatusMessage("Recording paused");
        break;
      case RecorderStatusTypes.PAUSE:
        resumeRecording();
        start();
        setRecorderStatus(RecorderStatusTypes.RECORDING);
        setStatusMessage("Recording...");
        break;
      case RecorderStatusTypes.COMPLETE:
        setRecorderStatus(RecorderStatusTypes.SAVED);
        setStatusMessage("Recording saved");
        break;
      case RecorderStatusTypes.SAVED:
        resetRecorder();
        break;

      default:
        handlePermissionPrompt();
        break;
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    pause();
    setRecorderStatus(RecorderStatusTypes.COMPLETE);
    setStatusMessage("Recording complete");
  };

  const handleClearRecording = () => {
    reset(0, false);
    setIsReadyPlayerTimer(false);
    setPlayerStatus(PlayerStatusTypes.DEFAULT);
    setRecorderStatus(RecorderStatusTypes.DEFAULT);
    setStatusMessage("Press to start recording");
    setIsClear(true);
  };

  const handlePausePlayer = () => {
    setPlayerStatus(PlayerStatusTypes.PAUSE);
  };

  const handlePlayPlayer = () => {
    if (!isReadyPlayerTimer) {
      setIsReadyPlayerTimer(true);
    }
    setPlayerStatus(PlayerStatusTypes.PLAY);
  };

  const handleStopPlayer = () => {
    setPlayerStatus(PlayerStatusTypes.DEFAULT);
    setRecorderStatus(RecorderStatusTypes.DEFAULT);
    setStatusMessage("Press to start recording");
    setIsClear(true);
    reset(0, false);
    setIsReadyPlayerTimer(false);
  };

  const handlePlayerEnded = () => {
    setPlayerStatus(PlayerStatusTypes.DEFAULT);
  };

  return (
    <RecorderContainer ref={recorderContainerRef}>
      <RecorderLeft
        backgroundColor={backgroundColor}
        denied={isPermissionDenied}
        dimension={dimension}
        disabled={isDisabled}
        iconColor={iconColor}
        onClick={handleRecorderClick}
        status={recorderStatus}
      />
      <RecorderRight
        blobUrl={mediaBlobUrl}
        days={days}
        hours={hours}
        isClear={isClear}
        isReadyPlayerTimer={isReadyPlayerTimer}
        minutes={minutes}
        onBlobChanged={onRecordingComplete}
        onClearBlobUrl={clearBlobUrl}
        onClearRecording={handleClearRecording}
        onPausePlayer={handlePausePlayer}
        onPlayPlayer={handlePlayPlayer}
        onPlayerEnded={handlePlayerEnded}
        onStopPlayer={handleStopPlayer}
        onStopRecording={handleStopRecording}
        playerStatus={playerStatus}
        recorderStatus={recorderStatus}
        seconds={seconds}
        statusMessage={statusMessage}
      />
    </RecorderContainer>
  );
}

export default AudioRecorderComponent;
