import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Icon } from "@blueprintjs/core";
import Webcam from "react-webcam";

import { CameraMode, CameraModeTypes } from "../constants";
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
  captureImage: () => void;
}

function ControlPanel(props: ControlPanelProps) {
  const { captureImage, mode } = props;

  const handleCapture = useCallback(() => {
    if (mode === CameraModeTypes.CAMERA) {
      captureImage();
    }
  }, [captureImage]);

  return (
    <ControlPanelContainer>
      <StyledCaptureButton
        icon={<Icon color="white" icon="full-circle" iconSize={20} />}
        mode={mode}
        onClick={handleCapture}
      />
    </ControlPanelContainer>
  );
}

function CameraComponent(props: CameraComponentProps) {
  const { height, mode, onImageCapture, onVideoCapture, width } = props;

  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>();
  const [video, setVideo] = useState();

  useEffect(() => {
    onImageCapture(image);
  }, [image]);

  useEffect(() => {
    onVideoCapture(video);
  }, [video]);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const capturedImage = webcamRef.current.getScreenshot();
      setImage(capturedImage);
    }
  }, [webcamRef, setImage]);

  return (
    <CameraContainer>
      <Webcam height={height} ref={webcamRef} width={width} />
      <ControlPanel captureImage={captureImage} mode={mode} />
    </CameraContainer>
  );
}

export interface CameraComponentProps {
  disabled: boolean;
  height: number;
  mirrored: boolean;
  mode: CameraMode;
  onImageCapture: (image?: string | null) => void;
  onVideoCapture: (video?: Blob) => void;
  width: number;
}

export default CameraComponent;
