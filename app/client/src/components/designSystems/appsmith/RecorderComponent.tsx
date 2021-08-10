import React, { useState, useMemo } from "react";
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

export enum RecorderStatusTypes {
  DEFAULT = "DEFAULT",
  RECORDING = "RECORDING",
  PAUSE = "PAUSE",
  COMPLETE = "COMPLETE",
}

export type RecorderStatus = keyof typeof RecorderStatusTypes;

interface RecorderContainerProps {
  isDisabled: boolean;
}

const RecorderContainer = styled.div<RecorderContainerProps>`
  display: flex;
  width: 100%;
  height: 100%;
`;

interface RecorderLeftButtonStyleProps {
  backgroundColor: string;
  dimension: number;
  iconColor: string;
}

const StyledRecorderLeftButton = styled(Button)<RecorderLeftButtonStyleProps>`
  background-image: none !important;
  background-color: ${({ backgroundColor }) => backgroundColor} !important;
  border-radius: 50%;
  height: ${({ dimension }) => `${dimension}px`};
  width: ${({ dimension }) => `${dimension}px`};

  & > svg {
    flex: 1;
    height: 50%;
    path {
      fill: ${({ iconColor }) => iconColor};
    }
  }
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
  recorderStatus?: RecorderStatus;
}

function RecorderLeft(props: RecorderLeftProps) {
  const { backgroundColor, dimension, iconColor, recorderStatus } = props;
  return (
    <StyledRecorderLeftButton
      backgroundColor={backgroundColor}
      dimension={dimension}
      icon={renderRecorderIcon(recorderStatus)}
      iconColor={iconColor}
    />
  );
}

function StopButton() {
  return <Button icon="symbol-square" minimal outlined small />;
}

function ClearButton() {
  return <Button icon="small-cross" minimal outlined small />;
}

interface RecorderRightProps {
  status: StatusMessages;
}

function RecorderRight(props: RecorderRightProps) {
  const { status } = props;
  return (
    <div className="rightContainer">
      <div className="status">{status}</div>
      <div className="controls">
        <div className="counter">01:10</div>
        <div className="stop">
          <StopButton />
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

  const dimension = useMemo(() => {
    if (width > height) {
      return height - WIDGET_PADDING * 2;
    }

    return width - WIDGET_PADDING * 2;
  }, [height, width]);

  const {
    mediaBlobUrl,
    pauseRecording,
    startRecording,
    status,
    stopRecording,
  } = useReactMediaRecorder({});

  return (
    <RecorderContainer isDisabled={isDisabled}>
      {/* <p>{status}</p>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      {mediaBlobUrl && <audio controls src={mediaBlobUrl} />} */}
      <RecorderLeft
        backgroundColor={backgroundColor}
        dimension={dimension}
        iconColor={iconColor}
        recorderStatus={RecorderStatusTypes.PAUSE}
      />
      <RecorderRight status={status} />
    </RecorderContainer>
  );
}

export default RecorderComponent;
