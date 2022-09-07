import React, { useCallback, useEffect, useState } from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { BaseButton } from "widgets/ButtonWidget/component";
import Modal from "react-modal";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import styled, { createGlobalStyle } from "styled-components";
import CloseIcon from "assets/icons/ads/cross.svg";
import { getBrowserInfo, getPlatformOS, PLATFORM_OS } from "utils/helpers";
import { Button, Icon, Menu, MenuItem, Position } from "@blueprintjs/core";
import { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { ReactComponent as CameraOfflineIcon } from "assets/icons/widget/camera/camera-offline.svg";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";
import { useSelector } from "store";
import log from "loglevel";
import { Popover2 } from "@blueprintjs/popover2";
import Interweave from "interweave";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { ButtonPlacement } from "components/constants";

const CodeScannerGlobalStyles = createGlobalStyle<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  .code-scanner-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2000;
    height: 90%;
    max-height: 500px;
    width: 90%;
    max-width: 500px;
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => boxShadow};
    background-color: black;
  }

  .code-scanner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(16, 22, 26, 0.7);
    z-index: 10;
  }

  .code-scanner-close {
    background-color: white;
    width: 32px;
    height: 32px;
    text-align: center;
    position: absolute;
    top: -36px;
    right: -2px;
    border-radius: ${({ borderRadius }) => borderRadius};
    background-image: url(${CloseIcon});
    background-repeat: no-repeat;
    background-position: center;
  }

  @media only screen and (min-width: 820px) {
    .code-scanner-close {
      right: -36px;
    }
  }
  
  @keyframes scan {
    from {top: 0%}
    to {top: calc(100% - 4px);}
  }

  .code-scanner-camera-container {
    border-radius: ${({ borderRadius }) => borderRadius};
    overflow: hidden;
    height: 100%;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0%;
      left: 0;
      height: 4px;
      width: 100%;
      background-color: rgba(255, 0, 0, 0.75);
      animation-name: scan;
      animation-duration: 2s;
      animation-direction: alternate;
      animation-iteration-count: infinite;
      animation-timing-function: ease-in-out;
      z-index: 1;
      border-radius: ${({ borderRadius }) => borderRadius};
    }
  }

  .code-scanner-camera-container video {
    height: 100%;
    position: relative;
    object-fit: cover;
    border-radius: ${({ borderRadius }) => borderRadius};
  }
`;

const DeviceButtonContainer = styled.div`
  position: relative;
`;

const DeviceMenuContainer = styled.div`
  position: absolute;
  bottom: 34px;
  right: 0;
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
  z-index: 4;

  flex-direction: ${({ appLayoutType }) =>
    appLayoutType === "MOBILE" ? `column` : `row`};
`;

const MediaInputsContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;

  & .bp3-minimal {
    height: 30px;
    width: 60px;
  }
`;

const ToolTipWrapper = styled.div`
  height: 100%;
  && .bp3-popover2-target {
    height: 100%;
    width: 100%;
    & > div {
      height: 100%;
    }
  }
`;

const TooltipStyles = createGlobalStyle`
  .iconBtnTooltipContainer {
    .bp3-popover2-content {
      max-width: 350px;
      overflow-wrap: anywhere;
      padding: 10px 12px;
      border-radius: 0px;
    }
  }
`;

const ErrorMessageWrapper = styled.div`
  height: 100%;
  width: 100%;
  padding: 0.5em 0;
  text-align: center;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

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
  disabled?: boolean;
  disabledIcon?: boolean;
  disabledMenu?: boolean;
  isMenuOpen: boolean;
  items: MediaDeviceInfo[];
  onDeviceMute?: (isMute: boolean) => void;
  onItemClick: (item: MediaDeviceInfo) => void;
  onMenuClick: (isMenuOpen: boolean) => void;
}

function DevicePopover(props: DevicePopoverProps) {
  const { disabledMenu, isMenuOpen, items, onItemClick, onMenuClick } = props;

  return (
    <DeviceButtonContainer>
      <Button
        disabled={disabledMenu}
        minimal
        onClick={() => onMenuClick(!isMenuOpen)}
        rightIcon={
          <>
            <Icon color="white" icon="mobile-video" />
            <Icon color="white" icon="caret-down" />
          </>
        }
      />
      {isMenuOpen && (
        <DeviceMenuContainer>
          <DeviceMenu items={items} onItemClick={onItemClick} />
        </DeviceMenuContainer>
      )}
    </DeviceButtonContainer>
  );
}

export interface ControlPanelProps {
  videoInputs: MediaDeviceInfo[];
  appLayoutType?: SupportedLayouts;
  onMediaInputChange: (mediaDeviceInfo: MediaDeviceInfo) => void;
  updateDeviceInputs: () => void;
}

function ControlPanel(props: ControlPanelProps) {
  const { appLayoutType, onMediaInputChange, videoInputs } = props;
  const [isOpenVideoDeviceMenu, setIsOpenVideoDeviceMenu] = useState<boolean>(
    false,
  );

  // Close the device menu by user click anywhere on the screen
  useEffect(() => {
    const handleClickOutside = () => {
      isOpenVideoDeviceMenu && setIsOpenVideoDeviceMenu(false);
    };

    document.addEventListener("click", handleClickOutside, false);
    return () => {
      document.removeEventListener("click", handleClickOutside, false);
    };
  }, [isOpenVideoDeviceMenu]);

  const handleOnVideoCaretClick = (isMenuOpen: boolean) => {
    /**
     * Update available device inputs when the device menu opens
     * Cannot update the list when the component mounts since often times
     * the component mounts before giving the camera permissions
     * This will also ensure that the user always sees the latest input
     * options available when they open the menu
     */
    props.updateDeviceInputs();
    setIsOpenVideoDeviceMenu(isMenuOpen);
  };

  const renderMediaDeviceSelectors = () => {
    const browserInfo = getBrowserInfo();
    const isSafari =
      getPlatformOS() === PLATFORM_OS.IOS ||
      (getPlatformOS() === PLATFORM_OS.MAC &&
        typeof browserInfo === "object" &&
        browserInfo?.browser === "Safari");

    return (
      <DevicePopover
        disabled={isSafari}
        disabledIcon={isSafari}
        isMenuOpen={isOpenVideoDeviceMenu}
        items={videoInputs}
        onItemClick={onMediaInputChange}
        onMenuClick={handleOnVideoCaretClick}
      />
    );
  };

  return (
    <ControlPanelContainer>
      <ControlPanelOverlayer appLayoutType={appLayoutType}>
        <MediaInputsContainer>
          {renderMediaDeviceSelectors()}
        </MediaInputsContainer>
      </ControlPanelOverlayer>
    </ControlPanelContainer>
  );
}

function CodeScannerComponent(props: CodeScannerComponentProps) {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [videoConstraints, setVideoConstraints] = useState<
    MediaTrackConstraints
  >({
    facingMode: "environment",
  });

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const appLayout = useSelector(getCurrentApplicationLayout);

  const handleDeviceInputs = useCallback(
    (mediaInputs: MediaDeviceInfo[]) => {
      setVideoInputs(mediaInputs.filter(({ kind }) => kind === "videoinput"));
    },
    [setVideoInputs],
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
      if (mediaDeviceInfo.kind === "videoinput") {
        setVideoConstraints({
          ...videoConstraints,
          deviceId: mediaDeviceInfo.deviceId,
        });
      }
    },
    [],
  );

  const handleCameraErrors = useCallback((error: string | DOMException) => {
    if (typeof error === "string") {
      setError(error);
    }
    setError((error as DOMException).message);
  }, []);

  const renderComponent = () => {
    const handleOnResult = (err: any, result: any) => {
      if (!!result) {
        const codeData = result.text;

        setIsOpen(false);
        props.onCodeDetected(codeData);
      }

      if (!!err) {
        log.debug(err);
      }
    };

    return (
      <>
        <CodeScannerGlobalStyles
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
        />

        <Modal
          className="code-scanner-content"
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          overlayClassName="code-scanner-overlay"
        >
          {error && (
            <ErrorMessageWrapper>
              <CameraOfflineIcon />
              <span className="error-text">{error}&ensp;</span>
              {error === "Permission denied" && (
                <a
                  href="https://support.google.com/chrome/answer/2693767"
                  rel="noreferrer"
                  target="_blank"
                >
                  Know more
                </a>
              )}
            </ErrorMessageWrapper>
          )}

          {modalIsOpen && !error && (
            <div className="code-scanner-camera-container">
              <BarcodeScannerComponent
                key={JSON.stringify(videoConstraints)}
                onError={handleCameraErrors}
                onUpdate={handleOnResult}
                videoConstraints={videoConstraints}
              />
              <ControlPanel
                appLayoutType={appLayout?.type}
                onMediaInputChange={handleMediaDeviceChange}
                updateDeviceInputs={updateDeviceInputs}
                videoInputs={videoInputs}
              />
            </div>
          )}

          <button className="code-scanner-close" onClick={closeModal} />
        </Modal>
      </>
    );
  };

  const baseButtonWrapper = (
    <BaseButton
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      buttonColor={props.buttonColor}
      disabled={props.isDisabled}
      iconAlign={props.iconAlign}
      iconName={props.iconName}
      onClick={openModal}
      placement={props.placement}
      text={props.label}
    />
  );

  return (
    <>
      {!props.tooltip ? (
        baseButtonWrapper
      ) : (
        <ToolTipWrapper>
          <TooltipStyles />
          <Popover2
            autoFocus={false}
            content={<Interweave content={props.tooltip} />}
            hoverOpenDelay={200}
            interactionKind="hover"
            portalClassName="iconBtnTooltipContainer"
            position={Position.TOP}
          >
            {baseButtonWrapper}
          </Popover2>
        </ToolTipWrapper>
      )}

      {renderComponent()}
    </>
  );
}
export interface CodeScannerComponentProps extends ComponentProps {
  label: string;
  isDisabled: boolean;
  tooltip?: string;
  buttonColor: string;
  borderRadius: string;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  onCodeDetected: (value: string) => void;
}

export default CodeScannerComponent;
