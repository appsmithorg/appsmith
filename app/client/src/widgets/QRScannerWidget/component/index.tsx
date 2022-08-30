import React, { useCallback, useEffect, useState } from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { BaseButton } from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import Modal from "react-modal";
import { QrReader } from "react-qr-reader";
import ViewFinder from "./ViewFinder.svg";
import styled, { createGlobalStyle, css } from "styled-components";
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

const QRScannerGlobalStyles = createGlobalStyle<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  .qr-scanner-content {
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

  .qr-scanner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(16, 22, 26, 0.7);
    z-index: 3;
  }

  .qr-scanner-close {
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
    .qr-scanner-close {
      right: -36px;
    }
  }

  .qr-camera-container {
    border-radius: ${({ borderRadius }) => borderRadius};
    overflow: hidden;
    height: 100%;
  }

  .qr-camera {
    height: 100%;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background-image: url(${ViewFinder});
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
      z-index: 1;
    }
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

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");

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

function QRScannerComponent(props: QRScannerComponentProps) {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>("");
  const [videoConstraints, setVideoConstraints] = useState<
    MediaTrackConstraints
  >({});

  const openModal = () => {
    setIsOpen(true);
  };

  function closeModal() {
    setIsOpen(false);
  }

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

  const renderComponent = () => {
    if (error) {
      return (
        <>
          <CameraOfflineIcon />
          <span className="error-text">{error}</span>
          {error === "Permission denied" && (
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

    const handleOnResult = (result: any, error: any) => {
      if (!!result) {
        const qrCodeData = result.getText();

        setIsOpen(false);
        // props.updateValue(qrCodeData);
        props.onCodeDetected(qrCodeData);
      }

      if (!!error) {
        log.debug(error);
      }
    };

    return (
      <>
        <DisabledOverlayer disabled={props.isDisabled}>
          <CameraOfflineIcon />
        </DisabledOverlayer>

        <QRScannerGlobalStyles
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
        />

        <Modal
          className="qr-scanner-content"
          isOpen={modalIsOpen}
          overlayClassName="qr-scanner-overlay"
        >
          {modalIsOpen && (
            <div className="qr-camera-container">
              <QrReader
                // ViewFinder={ViewFinder}
                className="qr-camera"
                constraints={videoConstraints}
                key={JSON.stringify(videoConstraints)}
                onResult={handleOnResult}
                videoContainerStyle={{ height: "100%" }}
                videoStyle={{ objectFit: "cover" }}
              />
              <ControlPanel
                appLayoutType={appLayout?.type}
                onMediaInputChange={handleMediaDeviceChange}
                updateDeviceInputs={updateDeviceInputs}
                videoInputs={videoInputs}
              />
            </div>
          )}

          <button className="qr-scanner-close" onClick={closeModal} />
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
      onClick={openModal}
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
export interface QRScannerComponentProps extends ComponentProps {
  label: string;
  isDisabled: boolean;
  tooltip?: string;
  buttonColor: string;
  borderRadius: string;
  boxShadow?: string;
  onCodeDetected: (value: string) => void;
}

QRScannerComponent.defaultProps = {
  backgroundColor: Colors.GREEN,
};

export default QRScannerComponent;
