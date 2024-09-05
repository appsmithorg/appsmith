import React, { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import { BaseButton } from "widgets/ButtonWidget/component";
import Modal from "react-modal";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import styled, { createGlobalStyle, css } from "styled-components";
import CloseIcon from "assets/icons/ads/cross.svg";
import { getBrowserInfo, getPlatformOS, PLATFORM_OS } from "utils/helpers";
import { Button, Icon, Menu, MenuItem, Position } from "@blueprintjs/core";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import log from "loglevel";
import { Popover2 } from "@blueprintjs/popover2";
import Interweave from "interweave";
import type { Alignment } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type {
  ButtonBorderRadius,
  ButtonPlacement,
  ButtonVariant,
} from "components/constants";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { ScannerLayout } from "../constants";
import type { ThemeProp } from "WidgetProvider/constants";
import { usePageVisibility } from "react-page-visibility";
import { importSvg } from "@appsmith/ads-old";
import { getVideoConstraints } from "widgets/utils";
import { isMobile } from "react-device-detect";

const CameraOfflineIcon = importSvg(
  async () => import("assets/icons/widget/camera/camera-offline.svg"),
);
const FlipImageIcon = importSvg(
  async () => import("assets/icons/widget/codeScanner/flip.svg"),
);

const CodeScannerGlobalStyles = createGlobalStyle<{
  borderRadius?: string;
  boxShadow?: string;
  disabled: boolean;
  scannerLayout: ScannerLayout;
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
    background: ${({ disabled }) =>
      disabled ? "var(--wds-color-bg-disabled)" : "#000"};
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow, scannerLayout }) =>
      scannerLayout === ScannerLayout.ALWAYS_ON ? boxShadow : "none"};
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

    &.mirror-video {
      video {
        transform: scaleX(-1);
      }
    }
  }

  .code-scanner-camera-container video {
    height: 100%;
    position: relative;
    object-fit: contain;
    border-radius: ${({ borderRadius }) => borderRadius};
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

const CodeScannerContainer = styled.div`
  height: 100%;
  width: 100%;
`;

const DisabledOverlayer = styled.div<DisabledOverlayerProps>`
  ${overlayerMixin};
  display: ${({ disabled }) => (disabled ? `flex` : `none`)};
  height: 100%;
  z-index: 2;
  background: var(--wds-color-bg-disabled);
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
  justify-content: space-between;

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

const ErrorMessageWrapper = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  height: 100%;
  width: 100%;
  padding: 0.5em 0;
  text-align: center;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: black;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow};
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

  &:hover {
    background: rgba(167, 182, 194, 0.3) !important;
  }
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
  handleImageMirror: () => void;
}

function ControlPanel(props: ControlPanelProps) {
  const { appLayoutType, onMediaInputChange, videoInputs } = props;
  const [isOpenVideoDeviceMenu, setIsOpenVideoDeviceMenu] =
    useState<boolean>(false);

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
          <StyledButton
            borderRadius={ButtonBorderRadiusTypes.SHARP}
            icon={<Icon color="white" icon={<FlipImageIcon />} iconSize={20} />}
            onClick={props.handleImageMirror}
            variant={ButtonVariantTypes.TERTIARY}
          />
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
  const [isImageMirrored, setIsImageMirrored] = useState(false);
  const [videoConstraints, setVideoConstraints] =
    useState<MediaTrackConstraints>(
      isMobile
        ? {
            facingMode: { ideal: props.defaultCamera },
          }
        : {},
    );

  /**
   * Check if the tab is active.
   * If not, stop scanning and detecting codes in background.
   */
  const isTabActive = usePageVisibility();

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
        const constraints = getVideoConstraints(
          videoConstraints,
          isMobile,
          "",
          mediaDeviceInfo.deviceId,
        );
        setVideoConstraints(constraints);
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

  const handleImageMirror = () => {
    setIsImageMirrored(!isImageMirrored);
  };

  const renderComponent = () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const errorMessage = (
      <ErrorMessageWrapper
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
      >
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
    );

    const codeScannerCameraContainer = (
      <div
        className={`code-scanner-camera-container ${
          isImageMirrored ? "mirror-video" : ""
        }`}
      >
        {props.isDisabled ? (
          <DisabledOverlayer disabled={props.isDisabled}>
            <CameraOfflineIcon />
          </DisabledOverlayer>
        ) : (
          <>
            {isTabActive && (
              <BarcodeScannerComponent
                delay={1000}
                key={JSON.stringify(videoConstraints)}
                onError={handleCameraErrors}
                onUpdate={handleOnResult}
                videoConstraints={videoConstraints}
              />
            )}

            <ControlPanel
              appLayoutType={appLayout?.type}
              handleImageMirror={handleImageMirror}
              onMediaInputChange={handleMediaDeviceChange}
              updateDeviceInputs={updateDeviceInputs}
              videoInputs={videoInputs}
            />
          </>
        )}
      </div>
    );

    const scanAlways = error ? errorMessage : codeScannerCameraContainer;

    const scanInAModal = (
      <Modal
        className="code-scanner-content"
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        overlayClassName="code-scanner-overlay"
      >
        {error ? errorMessage : modalIsOpen && codeScannerCameraContainer}

        <button className="code-scanner-close" onClick={closeModal} />
      </Modal>
    );

    return (
      <>
        <CodeScannerGlobalStyles
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
          disabled={props.isDisabled}
          scannerLayout={props.scannerLayout}
        />

        {props.scannerLayout === ScannerLayout.ALWAYS_ON
          ? scanAlways
          : scanInAModal}
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
      shouldFitContent={props.shouldButtonFitContent}
      text={props.label}
    />
  );

  return (
    <CodeScannerContainer onClick={(e) => e.stopPropagation()}>
      {props.scannerLayout !== ScannerLayout.ALWAYS_ON &&
        (!props.tooltip ? (
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
        ))}

      {renderComponent()}
    </CodeScannerContainer>
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
  scannerLayout: ScannerLayout;
  shouldButtonFitContent: boolean;
  defaultCamera: string;
}

export default CodeScannerComponent;
