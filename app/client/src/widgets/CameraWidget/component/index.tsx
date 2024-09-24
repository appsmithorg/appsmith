import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";
import { Button, Icon, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import Webcam from "react-webcam";
import { useStopwatch } from "react-timer-hook";
import type { FullScreenHandle } from "react-full-screen";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import log from "loglevel";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

import type { ButtonBorderRadius, ButtonVariant } from "components/constants";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import {
  getBrowserInfo,
  getPlatformOS,
  getSupportedMimeTypes,
  PLATFORM_OS,
} from "utils/helpers";

import type {
  CameraMode,
  DeviceType,
  MediaCaptureAction,
  MediaCaptureStatus,
} from "../constants";
import {
  CameraModeTypes,
  DeviceTypes,
  MediaCaptureActionTypes,
  MediaCaptureStatusTypes,
} from "../constants";
import type { ThemeProp } from "WidgetProvider/constants";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { importSvg } from "@appsmith/ads-old";
import { getVideoConstraints } from "../../utils";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";

const CameraOfflineIcon = importSvg(
  async () => import("assets/icons/widget/camera/camera-offline.svg"),
);
const CameraIcon = importSvg(
  async () => import("assets/icons/widget/camera/camera.svg"),
);
const CameraMutedIcon = importSvg(
  async () => import("assets/icons/widget/camera/camera-muted.svg"),
);
const MicrophoneIcon = importSvg(
  async () => import("assets/icons/widget/camera/microphone.svg"),
);
const MicrophoneMutedIcon = importSvg(
  async () => import("assets/icons/widget/camera/microphone-muted.svg"),
);
const FullScreenIcon = importSvg(
  async () => import("assets/icons/widget/camera/fullscreen.svg"),
);
const ExitFullScreenIcon = importSvg(
  async () => import("assets/icons/widget/camera/exit-fullscreen.svg"),
);

const overlayerMixin = css`
  position: absolute;
  height: 100%;
  width: 100%;
  object-fit: contain;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export interface CameraContainerProps {
  disabled: boolean;
  boxShadow: string;
  borderRadius: string;
}

const CameraContainer = styled.div<CameraContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100%;
  width: 100%;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow};
  background: ${({ disabled }) => (disabled ? Colors.GREY_3 : Colors.BLACK)};

  .fullscreen {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    span.error-text {
      color: ${Colors.GREY_8};
    }
  }

  video {
    height: 100%;
    width: 100%;
    object-fit: contain;
  }

  .fullscreen-enabled {
    video {
      height: 100%;
    }
    background: ${Colors.BLACK};
  }
`;

export interface DisabledOverlayerProps {
  disabled: boolean;
}

const DisabledOverlayer = styled.div<DisabledOverlayerProps>`
  ${overlayerMixin};
  display: ${({ disabled }) => (disabled ? `flex` : `none`)};
  height: 100%;
  z-index: 2;
  background: ${Colors.GREY_3};
`;

const PhotoViewer = styled.img`
  ${overlayerMixin}
`;

const VideoPlayer = styled.video`
  ${overlayerMixin}
`;

const ControlPanelContainer = styled.div`
  width: 100%;
`;

export interface ControlPanelOverlayerProps {
  appLayoutType?: SupportedLayouts;
}

const ControlPanelOverlayer = styled.div<ControlPanelOverlayerProps>`
  position: absolute;
  width: 100%;
  left: 0;
  bottom: 0;
  padding: 1%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  flex-direction: ${({ appLayoutType }) =>
    appLayoutType === "MOBILE" ? `column` : `row`};
`;

const MediaInputsContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-start;

  & .bp3-minimal {
    height: 30px;
    width: 40px;
  }
`;

const MainControlContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
`;

const FullscreenContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
`;

const TimerContainer = styled.div`
  position: absolute;
  top: 2%;
  padding: 1%;
  background: #4b4848;
  color: #ffffff;
`;

const DeviceButtonContainer = styled.div`
  position: relative;
`;

const DeviceMenuContainer = styled.div`
  position: absolute;
  bottom: 34px;
`;

export interface StyledButtonProps {
  variant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
}

const StyledButton = styled(Button)<ThemeProp & StyledButtonProps>`
  z-index: 1;
  height: 32px;
  width: 32px;
  margin: 0 1%;
  box-shadow: none !important;
  ${({ borderRadius }) =>
    borderRadius === ButtonBorderRadiusTypes.CIRCLE &&
    `
    border-radius: 50%;
  `}
  border: ${({ variant }) =>
    variant === ButtonVariantTypes.SECONDARY ? `1px solid white` : `none`};
  background: ${({ theme, variant }) =>
    variant === ButtonVariantTypes.PRIMARY
      ? theme.colors.button.primary.primary.bgColor
      : `none`} !important;
`;

export interface ControlPanelProps {
  mode: CameraMode;
  audioInputs: MediaDeviceInfo[];
  audioMuted: boolean;
  videoMuted: boolean;
  videoInputs: MediaDeviceInfo[];
  status: MediaCaptureStatus;
  appLayoutType?: SupportedLayouts;
  fullScreenHandle: FullScreenHandle;
  onImageCapture: () => void;
  onImageSave: () => void;
  onMediaInputChange: (mediaDeviceInfo: MediaDeviceInfo) => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onResetMedia: () => void;
  onStatusChange: (status: MediaCaptureStatus) => void;
  onToggleAudio: (isMute: boolean) => void;
  onToggleVideo: (isMute: boolean) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoSave: () => void;
}

function ControlPanel(props: ControlPanelProps) {
  const {
    appLayoutType,
    audioInputs,
    audioMuted,
    fullScreenHandle,
    mode,
    onImageCapture,
    onImageSave,
    onMediaInputChange,
    onRecordingStart,
    onRecordingStop,
    onResetMedia,
    onStatusChange,
    onToggleAudio,
    onToggleVideo,
    onVideoPause,
    onVideoPlay,
    onVideoSave,
    status,
    videoInputs,
    videoMuted,
  } = props;
  const [isOpenAudioDeviceMenu, setIsOpenAudioDeviceMenu] =
    useState<boolean>(false);
  const [isOpenVideoDeviceMenu, setIsOpenVideoDeviceMenu] =
    useState<boolean>(false);

  // disable the camera and audio during the video recording
  const isDisableCameraAndAudioMenu = useMemo(() => {
    return (
      mode === CameraModeTypes.VIDEO &&
      status === MediaCaptureStatusTypes.VIDEO_RECORDING
    );
  }, [mode, status]);

  // Close the device menu by user click anywhere on the screen when fullscreen is true
  useEffect(() => {
    if (fullScreenHandle.active) {
      const handleClickOutside = () => {
        if (fullScreenHandle.node.current) {
          isOpenVideoDeviceMenu && setIsOpenVideoDeviceMenu(false);
          isOpenAudioDeviceMenu && setIsOpenAudioDeviceMenu(false);
        }
      };

      document.addEventListener("click", handleClickOutside, false);

      return () => {
        document.removeEventListener("click", handleClickOutside, false);
      };
    }
  }, [fullScreenHandle, isOpenVideoDeviceMenu, isOpenAudioDeviceMenu]);

  // Close the device menu when user exit from full screen mode
  useEffect(() => {
    if (fullScreenHandle.active) {
      setIsOpenVideoDeviceMenu(false);
      setIsOpenAudioDeviceMenu(false);
    }
  }, [fullScreenHandle]);

  const handleOnAudioCaretClick = (isMenuOpen: boolean) => {
    isOpenVideoDeviceMenu && setIsOpenVideoDeviceMenu(false);
    setIsOpenAudioDeviceMenu(isMenuOpen);
  };

  const handleOnVideoCaretClick = (isMenuOpen: boolean) => {
    isOpenAudioDeviceMenu && setIsOpenAudioDeviceMenu(false);
    setIsOpenVideoDeviceMenu(isMenuOpen);
  };

  const handleControlClick = (action: MediaCaptureAction) => {
    return () => {
      switch (action) {
        case MediaCaptureActionTypes.IMAGE_CAPTURE:
          onImageCapture();
          onStatusChange(MediaCaptureStatusTypes.IMAGE_CAPTURED);
          break;
        case MediaCaptureActionTypes.IMAGE_SAVE:
          onImageSave();
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
          onVideoSave();
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
    const browserInfo = getBrowserInfo();
    const isSafari =
      getPlatformOS() === PLATFORM_OS.IOS ||
      (getPlatformOS() === PLATFORM_OS.MAC &&
        typeof browserInfo === "object" &&
        browserInfo?.browser === "Safari");

    return (
      <>
        {mode === CameraModeTypes.VIDEO && (
          <DevicePopover
            deviceType={DeviceTypes.MICROPHONE}
            disabled={audioMuted || isSafari}
            disabledIcon={isSafari}
            disabledMenu={isDisableCameraAndAudioMenu}
            fullScreenHandle={fullScreenHandle}
            isMenuOpen={isOpenAudioDeviceMenu}
            items={audioInputs}
            onDeviceMute={onToggleAudio}
            onItemClick={onMediaInputChange}
            onMenuClick={handleOnAudioCaretClick}
          />
        )}
        <DevicePopover
          deviceType={DeviceTypes.CAMERA}
          disabled={videoMuted || isSafari}
          disabledIcon={isSafari}
          disabledMenu={isDisableCameraAndAudioMenu}
          fullScreenHandle={fullScreenHandle}
          isMenuOpen={isOpenVideoDeviceMenu}
          items={videoInputs}
          onDeviceMute={onToggleVideo}
          onItemClick={onMediaInputChange}
          onMenuClick={handleOnVideoCaretClick}
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
            variant={ButtonVariantTypes.SECONDARY}
          />
        );

      case MediaCaptureStatusTypes.IMAGE_CAPTURED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.IMAGE_SAVE)}
              variant={ButtonVariantTypes.PRIMARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.IMAGE_DISCARD,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.IMAGE_SAVED:
        return (
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.CIRCLE}
            icon={<Icon color="white" icon="refresh" iconSize={20} />}
            onClick={handleControlClick(MediaCaptureActionTypes.IMAGE_REFRESH)}
            variant={ButtonVariantTypes.TERTIARY}
          />
        );

      case MediaCaptureStatusTypes.VIDEO_DEFAULT:
        return (
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.CIRCLE}
            icon={<Icon color="#F22B2B" icon="full-circle" iconSize={20} />}
            onClick={handleControlClick(
              MediaCaptureActionTypes.RECORDING_START,
            )}
            variant={ButtonVariantTypes.SECONDARY}
          />
        );

      case MediaCaptureStatusTypes.VIDEO_RECORDING:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="#F22B2B" icon="stop" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_STOP,
              )}
              variant={ButtonVariantTypes.SECONDARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.VIDEO_CAPTURED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_SAVE,
              )}
              variant={ButtonVariantTypes.PRIMARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PLAY)}
              variant={ButtonVariantTypes.TERTIARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.VIDEO_PLAYING:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_SAVE,
              )}
              variant={ButtonVariantTypes.PRIMARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="pause" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PAUSE)}
              variant={ButtonVariantTypes.TERTIARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.VIDEO_PAUSED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.SHARP}
              icon={<Icon color="white" icon="tick" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_SAVE,
              )}
              variant={ButtonVariantTypes.PRIMARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(MediaCaptureActionTypes.VIDEO_PLAY)}
              variant={ButtonVariantTypes.TERTIARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="cross" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.RECORDING_DISCARD,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.VIDEO_SAVED:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_PLAY_AFTER_SAVE,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="refresh" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_REFRESH,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.VIDEO_PLAYING_AFTER_SAVE:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="pause" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_PAUSE_AFTER_SAVE,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="refresh" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_REFRESH,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      case MediaCaptureStatusTypes.VIDEO_PAUSED_AFTER_SAVE:
        return (
          <>
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="play" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_PLAY_AFTER_SAVE,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
            <StyledButton
              borderRadius={ButtonBorderRadiusTypes.CIRCLE}
              icon={<Icon color="white" icon="refresh" iconSize={20} />}
              onClick={handleControlClick(
                MediaCaptureActionTypes.VIDEO_REFRESH,
              )}
              variant={ButtonVariantTypes.TERTIARY}
            />
          </>
        );

      default:
        break;
    }
  };

  const renderFullscreenControl = () => {
    // Remove fullscreen functionality for ios mobile devices
    // due to fullscreen API is not supported to ios mobile devices.
    // https://caniuse.com/fullscreen
    if (getPlatformOS() === PLATFORM_OS.IOS) return null;

    return fullScreenHandle.active ? (
      <StyledButton
        borderRadius={ButtonBorderRadiusTypes.SHARP}
        icon={
          <Icon color="white" icon={<ExitFullScreenIcon />} iconSize={20} />
        }
        onClick={fullScreenHandle.exit}
        variant={ButtonVariantTypes.TERTIARY}
      />
    ) : (
      <StyledButton
        borderRadius={ButtonBorderRadiusTypes.SHARP}
        icon={<Icon color="white" icon={<FullScreenIcon />} iconSize={20} />}
        onClick={fullScreenHandle.enter}
        variant={ButtonVariantTypes.TERTIARY}
      />
    );
  };

  return (
    <ControlPanelContainer>
      <ControlPanelOverlayer appLayoutType={appLayoutType}>
        <MediaInputsContainer>
          {renderMediaDeviceSelectors()}
        </MediaInputsContainer>
        <MainControlContainer>{renderControls()}</MainControlContainer>
        <FullscreenContainer>{renderFullscreenControl()}</FullscreenContainer>
      </ControlPanelOverlayer>
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
  disabled?: boolean;
  disabledIcon?: boolean;
  disabledMenu?: boolean;
  fullScreenHandle: FullScreenHandle;
  isMenuOpen: boolean;
  items: MediaDeviceInfo[];
  onDeviceMute?: (isMute: boolean) => void;
  onItemClick: (item: MediaDeviceInfo) => void;
  onMenuClick: (isMenuOpen: boolean) => void;
}

function DevicePopover(props: DevicePopoverProps) {
  const {
    deviceType,
    disabled,
    disabledIcon,
    disabledMenu,
    fullScreenHandle,
    isMenuOpen,
    items,
    onDeviceMute,
    onItemClick,
    onMenuClick,
  } = props;

  const handleDeviceMute = useCallback(() => {
    if (onDeviceMute) {
      onDeviceMute(!disabled);
    }
  }, [disabled, onDeviceMute]);

  const renderLeftIcon = (deviceType: DeviceType) => {
    if (deviceType === DeviceTypes.CAMERA) {
      if (disabled) {
        return <CameraMutedIcon />;
      }

      return <CameraIcon />;
    }

    if (disabled) {
      return <MicrophoneMutedIcon />;
    }

    return <MicrophoneIcon />;
  };

  return (
    <>
      <Button
        disabled={disabledIcon}
        icon={renderLeftIcon(deviceType)}
        minimal
        onClick={handleDeviceMute}
      />
      {!fullScreenHandle.active ? (
        <Popover2
          content={<DeviceMenu items={items} onItemClick={onItemClick} />}
          disabled={disabledMenu}
          minimal
          portalContainer={
            document.getElementById(CANVAS_ART_BOARD) || undefined
          }
        >
          <Button
            disabled={disabledMenu}
            minimal
            rightIcon={<Icon color="white" icon="caret-down" />}
          />
        </Popover2>
      ) : (
        <DeviceButtonContainer>
          <Button
            disabled={disabledMenu}
            minimal
            onClick={() => onMenuClick(!isMenuOpen)}
            rightIcon={<Icon color="white" icon="caret-down" />}
          />
          {isMenuOpen && (
            <DeviceMenuContainer>
              <DeviceMenu items={items} onItemClick={onItemClick} />
            </DeviceMenuContainer>
          )}
        </DeviceButtonContainer>
      )}
    </>
  );
}

function CameraComponent(props: CameraComponentProps) {
  const {
    borderRadius,
    boxShadow,
    defaultCamera,
    disabled,
    mirrored,
    mode,
    onImageCapture,
    onImageSave,
    onRecordingStart,
    onRecordingStop,
    onVideoSave,
    videoBlobURL,
  } = props;

  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobileDevice();
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioConstraints, setAudioConstraints] =
    useState<MediaTrackConstraints>({});
  const [videoConstraints, setVideoConstraints] =
    useState<MediaTrackConstraints>(
      isMobile
        ? {
            height: 720,
            width: 1280,
            facingMode: { ideal: defaultCamera },
          }
        : {},
    );

  const [image, setImage] = useState<string | null>();
  const [mediaCaptureStatus, setMediaCaptureStatus] =
    useState<MediaCaptureStatus>(MediaCaptureStatusTypes.IMAGE_DEFAULT);
  const [isPhotoViewerReady, setIsPhotoViewerReady] = useState(false);
  const [isVideoPlayerReady, setIsVideoPlayerReady] = useState(false);
  const [playerDays, setPlayerDays] = useState(0);
  const [playerHours, setPlayerHours] = useState(0);
  const [playerMinutes, setPlayerMinutes] = useState(0);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [isReadyPlayerTimer, setIsReadyPlayerTimer] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [error, setError] = useState<string>("");
  const { days, hours, minutes, pause, reset, seconds, start } = useStopwatch({
    autoStart: false,
  });
  const fullScreenHandle = useFullScreenHandle();

  const isAirgappedInstance = isAirgapped();

  useEffect(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      updateMediaTracksEnabled(webcamRef.current.stream);
    }
  }, [isAudioMuted, isVideoMuted]);

  useEffect(() => {
    // Clean up
    resetMedia();

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
    if (videoBlobURL && videoElementRef.current) {
      videoElementRef.current.src = videoBlobURL;
      videoElementRef.current.addEventListener("ended", handlePlayerEnded);
      videoElementRef.current.addEventListener("timeupdate", handleTimeUpdate);
    }

    return () => {
      videoElementRef.current?.removeEventListener("ended", handlePlayerEnded);
      videoElementRef.current?.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );
    };
  }, [videoBlobURL, videoElementRef.current]);

  useEffect(() => {
    // Set the flags for previewing the captured photo and video
    const photoReadyStates: MediaCaptureStatus[] = [
      MediaCaptureStatusTypes.IMAGE_CAPTURED,
      MediaCaptureStatusTypes.IMAGE_SAVED,
    ];
    const videoReadyStates: MediaCaptureStatus[] = [
      MediaCaptureStatusTypes.VIDEO_CAPTURED,
      MediaCaptureStatusTypes.VIDEO_PLAYING,
      MediaCaptureStatusTypes.VIDEO_PAUSED,
      MediaCaptureStatusTypes.VIDEO_SAVED,
      MediaCaptureStatusTypes.VIDEO_PLAYING_AFTER_SAVE,
      MediaCaptureStatusTypes.VIDEO_PAUSED_AFTER_SAVE,
    ];

    setIsPhotoViewerReady(photoReadyStates.includes(mediaCaptureStatus));
    setIsVideoPlayerReady(videoReadyStates.includes(mediaCaptureStatus));
  }, [mediaCaptureStatus]);

  const appLayout = useSelector(getCurrentApplicationLayout);

  const handleDeviceInputs = useCallback(
    (mediaInputs: MediaDeviceInfo[]) => {
      setAudioInputs(mediaInputs.filter(({ kind }) => kind === "audioinput"));
      setVideoInputs(mediaInputs.filter(({ kind }) => kind === "videoinput"));
    },
    [setAudioInputs, setVideoInputs],
  );

  const updateDeviceInputs = useCallback(() => {
    try {
      navigator.mediaDevices
        .enumerateDevices()
        .then(handleDeviceInputs)
        .catch((err) => {
          setError(err.message);
        });
    } catch (e) {
      log.debug("Error in calling enumerateDevices");
    }
  }, [handleDeviceInputs]);

  const handleMediaDeviceChange = useCallback(
    (mediaDeviceInfo: MediaDeviceInfo) => {
      if (mediaDeviceInfo.kind === "audioinput") {
        setAudioConstraints({
          ...audioConstraints,
          deviceId: mediaDeviceInfo.deviceId,
        });
      }

      if (mediaDeviceInfo.kind === "videoinput") {
        const constraints = getVideoConstraints(
          videoConstraints,
          isMobile,
          "", // when switching camera device we don't want to set the default camera ( facing mode )
          mediaDeviceInfo.deviceId,
        );

        setVideoConstraints(constraints);
      }
    },
    [],
  );

  const updateMediaTracksEnabled = (stream: MediaStream) => {
    stream.getAudioTracks()[0].enabled = !isAudioMuted;
    stream.getVideoTracks()[0].enabled = !isVideoMuted;
  };

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

    onRecordingStop(null);
  }, [mode]);

  const handleStatusChange = useCallback(
    (status: MediaCaptureStatus) => {
      setMediaCaptureStatus(status);
    },
    [setMediaCaptureStatus],
  );

  const handleRecordingStart = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      const supportedVideoMimeType = getSupportedMimeTypes("video");

      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: supportedVideoMimeType,
      });
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable,
      );
      mediaRecorderRef.current.start();
      start();
      onRecordingStart();
    }
  }, [webcamRef, mediaRecorderRef]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        onRecordingStop(data);
      }
    },
    [onRecordingStop],
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

  const handleUserMedia = (stream: MediaStream) => {
    updateDeviceInputs();
    updateMediaTracksEnabled(stream);
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
    if (error) {
      return (
        <>
          <CameraOfflineIcon />
          <span className="error-text">{error}</span>
          {error === "Permission denied" && !isAirgappedInstance && (
            <a
              href="https://help.sprucehealth.com/article/386-changing-permissions-for-video-and-audio-on-your-internet-browser"
              rel="noreferrer"
              target="_blank"
            >
              Know more
            </a>
          )}
        </>
      );
    }

    return (
      <>
        <DisabledOverlayer disabled={disabled}>
          <CameraOfflineIcon />
        </DisabledOverlayer>

        <Webcam
          audio
          audioConstraints={audioConstraints}
          forceScreenshotSourceSize={isMobile ? true : undefined}
          mirrored={mirrored}
          muted
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaErrors}
          ref={webcamRef}
          screenshotQuality={1}
          videoConstraints={videoConstraints}
        />

        {isPhotoViewerReady && image && <PhotoViewer src={image} />}

        {isVideoPlayerReady && <VideoPlayer ref={videoElementRef} />}

        <ControlPanel
          appLayoutType={appLayout?.type}
          audioInputs={audioInputs}
          audioMuted={isAudioMuted}
          fullScreenHandle={fullScreenHandle}
          mode={mode}
          onImageCapture={captureImage}
          onImageSave={onImageSave}
          onMediaInputChange={handleMediaDeviceChange}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onResetMedia={resetMedia}
          onStatusChange={handleStatusChange}
          onToggleAudio={setIsAudioMuted}
          onToggleVideo={setIsVideoMuted}
          onVideoPause={handleVideoPause}
          onVideoPlay={handleVideoPlay}
          onVideoSave={onVideoSave}
          status={mediaCaptureStatus}
          videoInputs={videoInputs}
          videoMuted={isVideoMuted}
        />

        {renderTimer()}
      </>
    );
  };

  return (
    <CameraContainer
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      disabled={!!error || disabled}
      onClick={(event) => event.stopPropagation()}
    >
      <FullScreen handle={fullScreenHandle}>{renderComponent()}</FullScreen>
    </CameraContainer>
  );
}

export interface CameraComponentProps {
  disabled: boolean;
  height: number;
  mirrored: boolean;
  mode: CameraMode;
  onImageCapture: (image?: string | null) => void;
  onImageSave: () => void;
  onRecordingStart: () => void;
  onRecordingStop: (video: Blob | null) => void;
  onVideoSave: () => void;
  videoBlobURL?: string;
  width: number;
  borderRadius: string;
  boxShadow: string;
  defaultCamera: string;
}

export default CameraComponent;
