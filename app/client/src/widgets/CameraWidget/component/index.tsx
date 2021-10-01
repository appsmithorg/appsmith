import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import Webcam from "react-webcam";
import { useStopwatch } from "react-timer-hook";

import { ThemeProp } from "components/ads/common";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";

import {
  CameraMode,
  CameraModeTypes,
  DeviceType,
  DeviceTypes,
  MediaCaptureAction,
  MediaCaptureActionTypes,
  MediaCaptureStatus,
  MediaCaptureStatusTypes,
} from "../constants";
import { ReactComponent as CameraOfflineIcon } from "assets/icons/widget/camera/camera-offline.svg";
import { ReactComponent as CameraIcon } from "assets/icons/widget/camera/camera.svg";
import { ReactComponent as MicrophoneIcon } from "assets/icons/widget/camera/microphone.svg";

const CameraContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;
`;

export interface VideoPlayerProps {
  status: MediaCaptureStatus;
}

const VideoPlayer = styled.video<VideoPlayerProps>`
  position: absolute;
  visibility: ${({ status }) =>
    status === MediaCaptureStatusTypes.VIDEO_CAPTURED ||
    status === MediaCaptureStatusTypes.VIDEO_PLAYING ||
    status === MediaCaptureStatusTypes.VIDEO_PAUSED ||
    status === MediaCaptureStatusTypes.VIDEO_SAVED ||
    status === MediaCaptureStatusTypes.VIDEO_PLAYING_AFTER_SAVE ||
    status === MediaCaptureStatusTypes.VIDEO_PAUSED_AFTER_SAVE
      ? `visible`
      : `hidden`};
`;

const ControlPanelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 2%;
`;

const MediaInputsContainer = styled.div`
  position: absolute;
  width: 100%;
`;

const TimerContainer = styled.div`
  position: absolute;
  top: 2%;
  padding: 1%;
  background: #4b4848;
  color: #ffffff;
`;

export interface StyledButtonProps {
  variant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
}

const StyledButton = styled(Button)<ThemeProp & StyledButtonProps>`
  height: 32px;
  width: 32px;
  box-shadow: none !important;
  ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.CIRCLE &&
    `
    border-radius: 50%;
  `}
  border: ${({ variant }) =>
    variant === ButtonVariantTypes.OUTLINE ? `1px solid white` : `none`};
  background: ${({ theme, variant }) =>
    variant === ButtonVariantTypes.SOLID
      ? theme.colors.button.primary.solid.bgColor
      : `none`} !important;
`;

export interface ControlPanelProps {
  mode: CameraMode;
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  status: MediaCaptureStatus;
  onCaptureImage: () => void;
  onMediaInputChange: (mediaDeviceInfo: MediaDeviceInfo) => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onResetMedia: () => void;
  onStatusChange: (status: MediaCaptureStatus) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
}

function ControlPanel(props: ControlPanelProps) {
  const {
    audioInputs,
    onCaptureImage,
    onMediaInputChange,
    onRecordingStart,
    onRecordingStop,
    onResetMedia,
    onStatusChange,
    onVideoPause,
    onVideoPlay,
    status,
    videoInputs,
  } = props;

  const handleControlClick = (action: MediaCaptureAction) => {
    return () => {
      switch (action) {
        case MediaCaptureActionTypes.IMAGE_CAPTURE:
          onCaptureImage();
          onStatusChange(MediaCaptureStatusTypes.IMAGE_CAPTURED);
          break;
        case MediaCaptureActionTypes.IMAGE_SAVE:
          onStatusChange(MediaCaptureStatusTypes.IMAGE_SAVED);
          break;
        case MediaCaptureActionTypes.IMAGE_DISCARD:
          onResetMedia();
          onStatusChange(MediaCaptureStatusTypes.IMAGE_DEFAULT);
          break;
        case MediaCaptureActionTypes.IMAGE_REFRESH:
          onResetMedia();
          onStatusChange(MediaCaptureStatusTypes.IMAGE_DEFAULT);
          break;

        case MediaCaptureActionTypes.RECORDING_START:
          onRecordingStart();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_RECORDING);
          break;
        case MediaCaptureActionTypes.RECORDING_STOP:
          onRecordingStop();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_CAPTURED);
          break;
        case MediaCaptureActionTypes.RECORDING_DISCARD:
          onResetMedia();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_DEFAULT);
          break;
        case MediaCaptureActionTypes.RECORDING_SAVE:
          onStatusChange(MediaCaptureStatusTypes.VIDEO_SAVED);
          break;
        case MediaCaptureActionTypes.VIDEO_PLAY:
          onVideoPlay();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_PLAYING);
          break;
        case MediaCaptureActionTypes.VIDEO_PAUSE:
          onVideoPause();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_PAUSED);
          break;
        case MediaCaptureActionTypes.VIDEO_PLAY_AFTER_SAVE:
          onVideoPlay();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_PLAYING_AFTER_SAVE);
          break;
        case MediaCaptureActionTypes.VIDEO_PAUSE_AFTER_SAVE:
          onVideoPause();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_PAUSED_AFTER_SAVE);
          break;
        case MediaCaptureActionTypes.VIDEO_REFRESH:
          onResetMedia();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_DEFAULT);
          break;
        default:
          break;
      }
    };
  };

  const renderMediaDeviceSelectors = () => {
    return (
      <>
        <DevicePopover
          deviceType={DeviceTypes.MICROPHONE}
          items={audioInputs}
          onItemClick={onMediaInputChange}
        />
        <DevicePopover
          deviceType={DeviceTypes.CAMERA}
          items={videoInputs}
          onItemClick={onMediaInputChange}
        />
      </>
    );
  };

  const renderControls = () => {
    switch (status) {
      case MediaCaptureStatusTypes.IMAGE_DEFAULT:
        return (
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.CIRCLE}
            icon={<Icon color="white" icon="full-circle" iconSize={20} />}
            onClick={handleControlClick(MediaCaptureActionTypes.IMAGE_CAPTURE)}
            title="Take photo"
            variant={ButtonVariantTypes.OUTLINE}
          />
        );
        break;

      case MediaCaptureStatusTypes.IMAGE_CAPTURED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.IMAGE_SAVE)}
              title="Save"
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.IMAGE_DISCARD,
              )}
              title="Discard"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.IMAGE_SAVED:
        return (
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.CIRCLE}
            icon={<Icon color="white" icon="refresh" iconSize={20} />}
            onClick={handleControlClick(MediaCaptureActionTypes.IMAGE_REFRESH)}
            title="Refresh"
            variant={ButtonVariantTypes.GHOST}
          />
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_DEFAULT:
        return (
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.CIRCLE}
            icon={<Icon color="#F22B2B" icon="full-circle" iconSize={20} />}
            onClick={handleControlClick(
              MediaCaptureActionTypes.RECORDING_START,
            )}
            title="Start recording"
            variant={ButtonVariantTypes.OUTLINE}
          />
        );
        break;
      case MediaCaptureStatusTypes.VIDEO_RECORDING:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="#F22B2B" icon="stop" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_STOP,
              )}
              title="Stop recording"
              variant={ButtonVariantTypes.OUTLINE}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              title="Discard"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_CAPTURED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_SAVE,
              )}
              title="Save"
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PLAY)}
              title="Play"
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              title="Discard"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_PLAYING:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_SAVE,
              )}
              title="Save"
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="pause" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PAUSE)}
              title="Pause"
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              title="Discard"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_PAUSED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_SAVE,
              )}
              title="Save"
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PLAY)}
              title="Play"
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              title="Discard"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_SAVED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_PLAY_AFTER_SAVE,
              )}
              title="Play"
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="refresh" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_REFRESH,
              )}
              title="Refresh"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_PLAYING_AFTER_SAVE:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="pause" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_PAUSE_AFTER_SAVE,
              )}
              title="Pause"
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="refresh" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_REFRESH,
              )}
              title="Refresh"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      case MediaCaptureStatusTypes.VIDEO_PAUSED_AFTER_SAVE:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_PLAY_AFTER_SAVE,
              )}
              title="Play"
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="refresh" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_REFRESH,
              )}
              title="Refresh"
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      default:
        break;
    }
  };

  return (
    <ControlPanelContainer>
      <MediaInputsContainer>
        {renderMediaDeviceSelectors()}
      </MediaInputsContainer>
      {renderControls()}
    </ControlPanelContainer>
  );
}

// Timer(recording & playing)
const getFormattedDigit = (value: number) => {
  return value >= 10 ? value.toString() : `0${value.toString()}`;
};
export interface TimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function Timer(props: TimerProps) {
  const { days, hours, minutes, seconds } = props;
  return (
    <TimerContainer>
      {!!days && <span>{`${getFormattedDigit(days)}:`}</span>}
      {!!hours && <span>{`${getFormattedDigit(hours)}:`}</span>}
      <span>{`${getFormattedDigit(minutes)}:`}</span>
      <span>{`${getFormattedDigit(seconds)}`}</span>
    </TimerContainer>
  );
}

// Device menus (microphone, camera)
export interface DeviceMenuProps {
  items: MediaDeviceInfo[];
  onItemClick: (item: MediaDeviceInfo) => void;
}

function DeviceMenu(props: DeviceMenuProps) {
  const { items, onItemClick } = props;
  return (
    <Menu>
      {items.map((item: MediaDeviceInfo) => {
        return (
          <MenuItem
            key={item.deviceId}
            onClick={() => onItemClick(item)}
            text={item.label || item.deviceId}
          />
        );
      })}
    </Menu>
  );
}

export interface DevicePopoverProps {
  deviceType: DeviceType;
  items: MediaDeviceInfo[];
  onItemClick: (item: MediaDeviceInfo) => void;
}

function DevicePopover(props: DevicePopoverProps) {
  const { deviceType, items, onItemClick } = props;

  const renderLeftIcon = (deviceType: DeviceType) => {
    if (deviceType === DeviceTypes.CAMERA) {
      return <CameraIcon />;
    }
    return <MicrophoneIcon />;
  };

  return (
    <Popover2 content={<DeviceMenu items={items} onItemClick={onItemClick} />}>
      <Button
        icon={renderLeftIcon(deviceType)}
        minimal
        rightIcon="caret-down"
      />
    </Popover2>
  );
}

function CameraComponent(props: CameraComponentProps) {
  const {
    disabled,
    height,
    mirrored,
    mode,
    onImageCapture,
    onVideoCapture,
    width,
  } = props;

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const videoElementRef = useRef<HTMLVideoElement>(null);

  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioConstraints, setAudioConstraints] = useState<{
    deviceId?: string;
  }>({});
  const [videoConstraints, setVideoConstraints] = useState<{
    deviceId?: string;
  }>({});

  const [image, setImage] = useState<string | null>();
  const [video, setVideo] = useState<Blob | null>();
  const [mediaCaptureStatus, setMediaCaptureStatus] = useState<
    MediaCaptureStatus
  >(MediaCaptureStatusTypes.IMAGE_DEFAULT);

  const [playerDays, setPlayerDays] = useState(0);
  const [playerHours, setPlayerHours] = useState(0);
  const [playerMinutes, setPlayerMinutes] = useState(0);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [isReadyPlayerTimer, setIsReadyPlayerTimer] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { days, hours, minutes, pause, reset, seconds, start } = useStopwatch({
    autoStart: false,
  });

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(handleDeviceInputs)
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    setIsReadyPlayerTimer(false);
    if (mode === CameraModeTypes.CAMERA) {
      setMediaCaptureStatus(MediaCaptureStatusTypes.IMAGE_DEFAULT);
      return;
    }
    setMediaCaptureStatus(MediaCaptureStatusTypes.VIDEO_DEFAULT);

    return () => {
      mediaRecorderRef.current?.removeEventListener(
        "dataavailable",
        handleDataAvailable,
      );
    };
  }, [mode]);

  useEffect(() => {
    onImageCapture(image);
  }, [image]);

  useEffect(() => {
    onVideoCapture(video);

    if (video) {
      if (videoElementRef.current) {
        videoElementRef.current.src = URL.createObjectURL(video);
        videoElementRef.current.removeEventListener("ended", handlePlayerEnded);
        videoElementRef.current.addEventListener("ended", handlePlayerEnded);
        videoElementRef.current.removeEventListener(
          "timeupdate",
          handleTimeUpdate,
        );
        videoElementRef.current.addEventListener(
          "timeupdate",
          handleTimeUpdate,
        );
      }
    }

    return () => {
      videoElementRef.current?.removeEventListener("ended", handlePlayerEnded);
      videoElementRef.current?.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );
    };
  }, [video]);

  const handleDeviceInputs = useCallback(
    (mediaInputs: MediaDeviceInfo[]) => {
      setAudioInputs(mediaInputs.filter(({ kind }) => kind === "audioinput"));
      setVideoInputs(mediaInputs.filter(({ kind }) => kind === "videoinput"));
    },
    [setAudioInputs, setVideoInputs],
  );

  const handleMediaDeviceChange = useCallback(
    (mediaDeviceInfo: MediaDeviceInfo) => {
      if (mediaDeviceInfo.kind === "audioinput") {
        setAudioConstraints({
          ...audioConstraints,
          deviceId: mediaDeviceInfo.deviceId,
        });
      }
      if (mediaDeviceInfo.kind === "videoinput") {
        setVideoConstraints({
          ...videoConstraints,
          deviceId: mediaDeviceInfo.deviceId,
        });
      }
    },
    [],
  );

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const capturedImage = webcamRef.current.getScreenshot();
      setImage(capturedImage);
    }
  }, [webcamRef, setImage]);

  const resetMedia = useCallback(() => {
    setIsReadyPlayerTimer(false);
    reset(0, false);

    if (mode === CameraModeTypes.CAMERA) {
      setImage(null);
      return;
    }
    setVideo(null);
  }, [mode]);

  const handleStatusChange = useCallback(
    (status: MediaCaptureStatus) => {
      setMediaCaptureStatus(status);
    },
    [setMediaCaptureStatus],
  );

  const handleRecordingStart = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable,
      );
      mediaRecorderRef.current.start();
      start();
    }
  }, [webcamRef, mediaRecorderRef]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setVideo(data);
      }
    },
    [setVideo],
  );

  const handleRecordingStop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    pause();
  }, [mediaRecorderRef, webcamRef]);

  const handleVideoPlay = useCallback(() => {
    if (!isReadyPlayerTimer) {
      reset(0, false);
      setIsReadyPlayerTimer(true);
    }
    videoElementRef.current?.play();
  }, [videoElementRef]);

  const handleVideoPause = () => {
    videoElementRef.current?.pause();
  };

  const handlePlayerEnded = () => {
    setMediaCaptureStatus((prevStatus) => {
      switch (prevStatus) {
        case MediaCaptureStatusTypes.VIDEO_PLAYING_AFTER_SAVE:
          return MediaCaptureStatusTypes.VIDEO_SAVED;
        default:
          return MediaCaptureStatusTypes.VIDEO_CAPTURED;
      }
    });
  };

  const handleTimeUpdate = () => {
    if (videoElementRef.current) {
      const totalSeconds = Math.ceil(videoElementRef.current.currentTime);

      setPlayerDays(Math.floor(totalSeconds / (60 * 60 * 24)));
      setPlayerHours(Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60)));
      setPlayerMinutes(Math.floor((totalSeconds % (60 * 60)) / 60));
      setPlayerSeconds(Math.floor(totalSeconds % 60));
    }
  };

  const handleUserMedia = () => {
    setError("");
  };

  const handleUserMediaErrors = useCallback((error: string | DOMException) => {
    if (typeof error === "string") {
      setError(error);
    }
    setError((error as DOMException).message);
  }, []);

  const renderTimer = () => {
    if (mode === CameraModeTypes.VIDEO) {
      if (isReadyPlayerTimer) {
        return (
          <Timer
            days={playerDays}
            hours={playerHours}
            minutes={playerMinutes}
            seconds={playerSeconds}
          />
        );
      }
      return (
        <Timer days={days} hours={hours} minutes={minutes} seconds={seconds} />
      );
    }
    return null;
  };

  const renderComponent = () => {
    if (disabled) {
      return <CameraOfflineIcon />;
    }
    if (error) {
      return (
        <>
          <CameraOfflineIcon />
          <span>{error}</span>
        </>
      );
    }
    return (
      <>
        <Webcam
          audio
          audioConstraints={audioConstraints}
          height={height}
          mirrored={mirrored}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaErrors}
          ref={webcamRef}
          videoConstraints={videoConstraints}
          width={width}
        />

        <VideoPlayer
          height={height}
          ref={videoElementRef}
          status={mediaCaptureStatus}
          width={width}
        />

        <ControlPanel
          audioInputs={audioInputs}
          mode={mode}
          onCaptureImage={captureImage}
          onMediaInputChange={handleMediaDeviceChange}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onResetMedia={resetMedia}
          onStatusChange={handleStatusChange}
          onVideoPause={handleVideoPause}
          onVideoPlay={handleVideoPlay}
          status={mediaCaptureStatus}
          videoInputs={videoInputs}
        />

        {renderTimer()}
      </>
    );
  };

  return <CameraContainer>{renderComponent()}</CameraContainer>;
}

export interface CameraComponentProps {
  disabled: boolean;
  height: number;
  mirrored: boolean;
  mode: CameraMode;
  onImageCapture: (image?: string | null) => void;
  onVideoCapture: (video?: Blob | null) => void;
  width: number;
}

export default CameraComponent;
