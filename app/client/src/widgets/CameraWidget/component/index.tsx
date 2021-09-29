import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Icon } from "@blueprintjs/core";
import Webcam from "react-webcam";

import {
  CameraMode,
  CameraModeTypes,
  MediaCaptureAction,
  MediaCaptureActionTypes,
  MediaCaptureStatus,
  MediaCaptureStatusTypes,
} from "../constants";
import { ThemeProp } from "components/ads/common";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";

const CameraContainer = styled.div`
  display: flex;
  overflow: auto;
`;

export interface VideoPlayerProps {
  status: MediaCaptureStatus;
}

const VideoPlayer = styled.video<VideoPlayerProps>`
  position: absolute;
  visibility: ${({ status }) =>
    status === MediaCaptureStatusTypes.VIDEO_PLAYING ||
    status === MediaCaptureStatusTypes.VIDEO_PAUSED
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
  status: MediaCaptureStatus;
  onCaptureImage: () => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onResetMedia: () => void;
  onStatusChange: (status: MediaCaptureStatus) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
}

function ControlPanel(props: ControlPanelProps) {
  const {
    onCaptureImage,
    onRecordingStart,
    onRecordingStop,
    onResetMedia,
    onStatusChange,
    onVideoPause,
    onVideoPlay,
    status,
  } = props;

  const handleControlClick = useCallback((action: MediaCaptureAction) => {
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
        case MediaCaptureActionTypes.VIDEO_REFRESH:
          onResetMedia();
          onStatusChange(MediaCaptureStatusTypes.VIDEO_DEFAULT);
          break;
        default:
          break;
      }
    };
  }, []);

  const renderControls = () => {
    switch (status) {
      case MediaCaptureStatusTypes.IMAGE_DEFAULT:
        return (
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.CIRCLE}
            icon={<Icon color="white" icon="full-circle" iconSize={20} />}
            onClick={handleControlClick(MediaCaptureActionTypes.IMAGE_CAPTURE)}
            variant={ButtonVariantTypes.OUTLINE}
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
              variant={ButtonVariantTypes.OUTLINE}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
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
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PLAY)}
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
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
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="pause" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PAUSE)}
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
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
              variant={ButtonVariantTypes.SOLID}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PLAY)}
              variant={ButtonVariantTypes.GHOST}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              variant={ButtonVariantTypes.GHOST}
            />
          </>
        );
        break;

      default:
        break;
    }
  };

  return <ControlPanelContainer>{renderControls()}</ControlPanelContainer>;
}

function CameraComponent(props: CameraComponentProps) {
  const { height, mode, onImageCapture, onVideoCapture, width } = props;

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [image, setImage] = useState<string | null>();
  const [video, setVideo] = useState<Blob | null>();
  const [mediaCaptureStatus, setMediaCaptureStatus] = useState<
    MediaCaptureStatus
  >(MediaCaptureStatusTypes.IMAGE_DEFAULT);

  useEffect(() => {
    if (mode === CameraModeTypes.CAMERA) {
      setMediaCaptureStatus(MediaCaptureStatusTypes.IMAGE_DEFAULT);
      return;
    }
    setMediaCaptureStatus(MediaCaptureStatusTypes.VIDEO_DEFAULT);
    // Cleanup event listeners
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
      }
      return;
    }
  }, [video]);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const capturedImage = webcamRef.current.getScreenshot();
      setImage(capturedImage);
    }
  }, [webcamRef, setImage]);

  const resetMedia = useCallback(() => {
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
  }, [mediaRecorderRef, webcamRef]);

  const handleVideoPlay = useCallback(() => {
    console.error("playing...");
    videoElementRef.current?.play();
  }, [videoElementRef]);

  const handleVideoPause = () => {
    console.error("pausing...");
    videoElementRef.current?.pause();
  };

  return (
    <CameraContainer>
      <Webcam audio height={height} ref={webcamRef} width={width} />

      <VideoPlayer
        height={height}
        ref={videoElementRef}
        status={mediaCaptureStatus}
        width={width}
      />

      <ControlPanel
        mode={mode}
        onCaptureImage={captureImage}
        onRecordingStart={handleRecordingStart}
        onRecordingStop={handleRecordingStop}
        onResetMedia={resetMedia}
        onStatusChange={handleStatusChange}
        onVideoPause={handleVideoPause}
        onVideoPlay={handleVideoPlay}
        status={mediaCaptureStatus}
      />
    </CameraContainer>
  );
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
