import React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";

const ProgressBarWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ProgressBar = styled.div<{ progress?: number; fillColor: string }>`
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  position: relative;

  &:after {
    background: ${({ fillColor }) => fillColor};
    width: ${({ progress }) => (progress ? `${progress}%` : "")};
    transition: width 0.4s ease;
    position: absolute;
    content: "";
    left: 0;
    top: 0;
    bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 10px;
  color: ${Colors.GREY_10};
  padding-left: 4px;
  line-height: 16px;
`;

function ProgressBarComponent(props: ProgressBarComponentProps) {
  return (
    <ProgressBarWrapper className="t--progressbar-widget">
      <ProgressBar
        data-cy={props.progress}
        fillColor={props.fillColor}
        progress={props.progress}
      />
      {props.showResult && <Label>{props.progress}%</Label>}
    </ProgressBarWrapper>
  );
}

export interface ProgressBarComponentProps {
  progress?: number;
  showResult: boolean;
  fillColor: string;
}

export default ProgressBarComponent;
