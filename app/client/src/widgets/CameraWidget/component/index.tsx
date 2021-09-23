import React from "react";
import styled from "styled-components";
import { Button, Icon } from "@blueprintjs/core";
import Webcam from "react-webcam";

import { CameraMode } from "../constants";
import { ThemeProp } from "components/ads/common";

const CameraContainer = styled.div`
  display: flex;
  overflow: auto;
`;

const ControlPanelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 0;
  width: 100%;
`;

export interface CaptureButtonProps {
  mode: CameraMode;
}

const StyledCaptureButton = styled(Button)<ThemeProp & CaptureButtonProps>`
  height: 32px;
  width: 32px;
  border-radius: 50%;
  border: 1px solid white;
  background: transparent;
`;

export interface ControlPanelProps {
  mode: CameraMode;
}

function ControlPanel(props: ControlPanelProps) {
  const { mode } = props;

  return (
    <ControlPanelContainer>
      <StyledCaptureButton
        icon={<Icon color="white" icon="full-circle" iconSize={20} />}
        mode={mode}
      />
    </ControlPanelContainer>
  );
}

function CameraComponent(props: CameraComponentProps) {
  const { height, mode, width } = props;

  return (
    <CameraContainer>
      <Webcam height={height} width={width} />
      <ControlPanel mode={mode} />
    </CameraContainer>
  );
}

export interface CameraComponentProps {
  disabled: boolean;
  height: number;
  mirrored: boolean;
  mode: CameraMode;
  width: number;
}

export default CameraComponent;
