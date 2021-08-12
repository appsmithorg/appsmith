import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import styled from "styled-components";
import { Button, Icon } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { StatusMessages, useReactMediaRecorder } from "react-media-recorder";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { ReactComponent as RecorderDefaultIcon } from "assets/icons/widget/recorder/recorder_default.svg";
import { ReactComponent as RecorderRecordingIcon } from "assets/icons/widget/recorder/recorder_recording.svg";
import { ReactComponent as RecorderPauseIcon } from "assets/icons/widget/recorder/recorder_pause.svg";
import { ReactComponent as RecorderCompleteIcon } from "assets/icons/widget/recorder/recorder_complete.svg";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { hexToRgb } from "components/ads/common";

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

interface RecorderContainerProps {
  isDisabled: boolean;
}

const RecorderContainer = styled.div<RecorderContainerProps>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

interface RecorderLeftButtonStyleProps {
  backgroundColor: string;
  dimension: number;
  iconColor: string;
  status: RecorderStatus;
}

const getRgbaColor = (color: string, alpha: number) => {
  const rgb = hexToRgb(color);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const StyledRecorderLeftButton = styled(Button)<RecorderLeftButtonStyleProps>`
  background-image: none !important;
  border-radius: 50%;

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

  ${({ backgroundColor, dimension, status }) => `
    background: ${backgroundColor ? backgroundColor : "none"} !important;
    height: ${
      status === RecorderStatusTypes.RECORDING ? dimension - 8 : dimension
    }px;
    width: ${
      status === RecorderStatusTypes.RECORDING ? dimension - 8 : dimension
    }px;
    ${status === RecorderStatusTypes.RECORDING &&
      `
      box-shadow: 0 0 0 4px ${getRgbaColor(backgroundColor, 0.121)} !important;
    `}
  `}
`;

const renderRecorderIcon = (
  recorderStatus: RecorderStatus = RecorderStatusTypes.DEFAULT,
) => {
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
  iconColor: string;
  status: RecorderStatus;
  onClick: () => void;
}

function RecorderLeft(props: RecorderLeftProps) {
  const { backgroundColor, dimension, iconColor, onClick, status } = props;

  const handleClick = () => {
    onClick();
  };

  return (
    <StyledRecorderLeftButton
      backgroundColor={backgroundColor}
      dimension={dimension}
      icon={renderRecorderIcon(status)}
      iconColor={iconColor}
      onClick={handleClick}
      status={status}
    />
  );
}

export interface PlayerButtonProps {
  onClick: () => void;
}

function StopButton(props: PlayerButtonProps) {
  const { onClick } = props;
  return (
    <Button icon="symbol-square" minimal onClick={onClick} outlined small />
  );
}

function ClearButton() {
  return <Button icon="small-cross" minimal outlined small />;
}

interface RecorderRightProps {
  blobUrl: string | null;
  onStopRecording: () => void;
  statusMessage: string;
}

function RecorderRight(props: RecorderRightProps) {
  const { blobUrl, onStopRecording, statusMessage } = props;

  const handleStopRecording = () => {
    onStopRecording();
  };

  return (
    <div className="rightContainer">
      <div className="status">{statusMessage}</div>
      <div className="controls">
        <div className="counter">01:10</div>
        <div className="stop">
          <StopButton onClick={handleStopRecording} />
        </div>
        <div className="clear">
          <ClearButton />
        </div>
      </div>
    </div>
  );
}

export interface RecorderComponentProps extends ComponentProps {
  backgroundColor: string;
  height: number;
  iconColor: string;
  isDisabled: boolean;
  width: number;
}

function RecorderComponent(props: RecorderComponentProps) {
  const { backgroundColor, height, iconColor, isDisabled, width } = props;

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

  useEffect(() => {
    const recorderContainerElement = recorderContainerRef.current;
    if (recorderContainerElement) {
      setContainerWidth(recorderContainerElement.clientWidth);
    }
  }, [width, height]);

  const {
    mediaBlobUrl,
    pauseRecording,
    resumeRecording,
    startRecording,
    status,
    stopRecording,
  } = useReactMediaRecorder({});

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
        setRecorderStatus(RecorderStatusTypes.PAUSE);
        setStatusMessage("Recording paused");
        break;
      case RecorderStatusTypes.PAUSE:
        resumeRecording();
        setRecorderStatus(RecorderStatusTypes.RECORDING);
        setStatusMessage("Recording...");
        break;
      case RecorderStatusTypes.COMPLETE:
        setRecorderStatus(RecorderStatusTypes.DEFAULT);
        setStatusMessage("Recording saved");
        break;

      default:
        startRecording();
        setRecorderStatus(RecorderStatusTypes.RECORDING);
        setStatusMessage("Recording...");
        break;
    }
  };

  const handleStop = () => {
    stopRecording();
    setRecorderStatus(RecorderStatusTypes.COMPLETE);
    setStatusMessage("Recording complete");
  };

  return (
    <RecorderContainer isDisabled={isDisabled} ref={recorderContainerRef}>
      {/* <p>{status}</p>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      {mediaBlobUrl && <audio controls src={mediaBlobUrl} />} */}
      <RecorderLeft
        backgroundColor={backgroundColor}
        dimension={dimension}
        iconColor={iconColor}
        onClick={handleRecorderClick}
        status={recorderStatus}
      />
      <RecorderRight
        blobUrl={mediaBlobUrl}
        onStopRecording={handleStop}
        statusMessage={statusMessage}
      />
    </RecorderContainer>
  );
}

export default RecorderComponent;
