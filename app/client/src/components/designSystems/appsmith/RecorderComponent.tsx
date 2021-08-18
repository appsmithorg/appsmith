import React, { useEffect, useState, useMemo, useRef } from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import { useReactMediaRecorder } from "react-media-recorder";
import { useStopwatch } from "react-timer-hook";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { ReactComponent as RecorderDefaultIcon } from "assets/icons/widget/recorder/recorder_default.svg";
import { ReactComponent as RecorderRecordingIcon } from "assets/icons/widget/recorder/recorder_recording.svg";
import { ReactComponent as RecorderPauseIcon } from "assets/icons/widget/recorder/recorder_pause.svg";
import { ReactComponent as RecorderCompleteIcon } from "assets/icons/widget/recorder/recorder_complete.svg";
import { ReactComponent as RecorderNoPermissionIcon } from "assets/icons/widget/recorder/recorder_no_permission.svg";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { hexToRgb, ThemeProp } from "components/ads/common";
import { darkenHover } from "constants/DefaultTheme";

export enum RecorderStatusTypes {
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
  padding-left: 10%;

  & > .controls {
    display: flex;
    align-items: center;
    button {
      margin-left: 5%;
    }
  }
`;

const TimerContainer = styled.div<ThemeProp>`
  color: ${({ theme }) => theme.colors.button.disabled.bgColor};
`;

interface RecorderLeftButtonStyleProps {
  backgroundColor: string;
  dimension: number;
  disabled: boolean;
  iconColor: string;
  status: RecorderStatus;
}

const getRgbaColor = (color: string, alpha: number) => {
  const rgb = hexToRgb(color);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const StyledRecorderLeftButton = styled(Button)<
  ThemeProp & RecorderLeftButtonStyleProps
>`
  background-image: none !important;
  border-radius: 50%;
  height: ${({ dimension, status }) =>
    status === RecorderStatusTypes.RECORDING ? dimension - 8 : dimension}px;
  width: ${({ dimension, status }) =>
    status === RecorderStatusTypes.RECORDING ? dimension - 8 : dimension}px;
  box-shadow: ${({ backgroundColor, status }) =>
    status === RecorderStatusTypes.RECORDING &&
    `
      0 0 0 4px ${getRgbaColor(backgroundColor, 0.121)} !important;
    `}}

  & > svg {
    flex: 1;
    height: 50%;
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

  ${({ backgroundColor, theme }) => `
    &:enabled {
      background: ${backgroundColor ? backgroundColor : "none"} !important;
    }
    &:hover:enabled, &:active:enabled {
      background: ${darkenHover(backgroundColor || "#f6f6f6")} !important;
    }
    &:disabled {
      background-color: ${theme.colors.button.disabled.bgColor} !important;
      color: ${theme.colors.button.disabled.textColor} !important;
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
      break;
    case RecorderStatusTypes.PAUSE:
      return <RecorderPauseIcon />;
      break;
    case RecorderStatusTypes.RECORDING:
      return <RecorderRecordingIcon />;
      break;
    default:
      return <RecorderDefaultIcon />;
      break;
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
      return <Button icon="play" minimal onClick={onClick} outlined small />;
      break;
    case PlayerButtonIntentTypes.PAUSE:
      return <Button icon="pause" minimal onClick={onClick} outlined small />;
      break;
    case PlayerButtonIntentTypes.STOP:
      return (
        <Button icon="symbol-square" minimal onClick={onClick} outlined small />
      );
      break;

    default:
      return (
        <Button icon="small-cross" minimal onClick={onClick} outlined small />
      );
      break;
  }
}

interface RecorderRightProps {
  blobUrl: string | null;
  playerStatus: PlayerStatus;
  recorderStatus: RecorderStatus;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onPausePlayer: () => void;
  onPlayPlayer: () => void;
  onStopPlayer: () => void;
  onPlayerEnded: () => void;
  statusMessage: string;
  isReadyPlayer: boolean;
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
    isReadyPlayer,
    isReadyPlayerTimer,
    minutes,
    onPlayerEnded,
    playerStatus,
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

  const renderPlayerControls = (props: RecorderRightProps) => {
    const {
      onClearRecording,
      onPausePlayer,
      onPlayPlayer,
      onStopPlayer,
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
              onClick={onClearRecording}
            />
          </>
        );
        break;
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
                  onClick={onClearRecording}
                />
              </>
            );
            break;

          default:
            return (
              <>
                <PlayerButton
                  intent={PlayerButtonIntentTypes.PLAY}
                  onClick={onPlayPlayer}
                />
                <PlayerButton
                  intent={PlayerButtonIntentTypes.CLEAR}
                  onClick={onClearRecording}
                />
              </>
            );
            break;
        }
        break;
      case RecorderStatusTypes.SAVED:
        switch (playerStatus) {
          case PlayerStatusTypes.PLAY:
            return (
              <>
                <PlayerButton
                  intent={PlayerButtonIntentTypes.PAUSE}
                  onClick={onPausePlayer}
                />
                <PlayerButton
                  intent={PlayerButtonIntentTypes.STOP}
                  onClick={onStopPlayer}
                />
              </>
            );
            break;
          case PlayerStatusTypes.PAUSE:
            return (
              <>
                <PlayerButton
                  intent={PlayerButtonIntentTypes.PLAY}
                  onClick={onPlayPlayer}
                />
                <PlayerButton
                  intent={PlayerButtonIntentTypes.STOP}
                  onClick={onStopPlayer}
                />
              </>
            );
            break;

          default:
            return (
              <PlayerButton
                intent={PlayerButtonIntentTypes.PLAY}
                onClick={onPlayPlayer}
              />
            );
            break;
        }
        break;

      default:
        return null;
        break;
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
      <div className="controls">
        {isReadyPlayer && isReadyPlayerTimer
          ? renderTimer(
              currentDays,
              currentHours,
              currentMinutes,
              currentSeconds,
            )
          : renderTimer(days, hours, minutes, seconds)}
        {renderPlayerControls(props)}
      </div>
    </RightContainer>
  );
}

export interface RecorderComponentProps extends ComponentProps {
  backgroundColor: string;
  height: number;
  iconColor: string;
  isDisabled: boolean;
  onRecordingStart: () => void;
  onRecordingComplete: (blobUrl?: string, blob?: Blob) => void;
  width: number;
}

function RecorderComponent(props: RecorderComponentProps) {
  const {
    backgroundColor,
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
    RecorderStatusTypes.DEFAULT,
  );
  const [playerStatus, setPlayerStatus] = useState(PlayerStatusTypes.DEFAULT);
  const [statusMessage, setStatusMessage] = useState(
    "Press to start recording",
  );

  const [isReadyPlayer, setIsReadyPlayer] = useState(false);
  const [isReadyPlayerTimer, setIsReadyPlayerTimer] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  useEffect(() => {
    const recorderContainerElement = recorderContainerRef.current;
    if (recorderContainerElement) {
      setContainerWidth(recorderContainerElement.clientWidth);
    }
  }, [width, height]);

  const {
    clearBlobUrl,
    error,
    mediaBlobUrl,
    pauseRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useReactMediaRecorder({
    askPermissionOnMount: true,
    onStop: (blobUrl: string, blob: Blob) => onRecordingComplete(blobUrl, blob),
  });

  const { days, hours, minutes, pause, reset, seconds, start } = useStopwatch({
    autoStart: false,
  });

  useEffect(() => {
    if (isClear) {
      clearBlobUrl();
      onRecordingComplete();
    }
  }, [isClear]);

  useEffect(() => {
    if (error === "permission_denied") {
      setIsPermissionDenied(true);
    }
  }, [error]);

  const dimension = useMemo(() => {
    if (containerWidth > height) {
      return height - WIDGET_PADDING * 2;
    }

    return containerWidth;
  }, [containerWidth, height, width]);

  const handleRecorderClick = () => {
    switch (recorderStatus) {
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
        setRecorderStatus(RecorderStatusTypes.DEFAULT);
        setStatusMessage("Press to start recording");
        break;

      default:
        startRecording();
        start();
        setRecorderStatus(RecorderStatusTypes.RECORDING);
        setStatusMessage("Recording...");
        onRecordingStart();
        break;
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    pause();
    setIsReadyPlayer(true);
    setRecorderStatus(RecorderStatusTypes.COMPLETE);
    setStatusMessage("Recording complete");
  };

  const handleClearRecording = () => {
    reset(0, false);
    setIsReadyPlayer(false);
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
        isReadyPlayer={isReadyPlayer}
        isReadyPlayerTimer={isReadyPlayerTimer}
        minutes={minutes}
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

export default RecorderComponent;
