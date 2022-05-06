import React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { BarType } from "../constants";
import { isNaN } from "lodash";

const ProgressBarWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ProgressBar = styled.div<{
  progress?: number;
  fillColor: string;
  borderRadius?: string;
}>`
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  position: relative;
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;

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
  font-size: 14px;
  color: ${Colors.GREY_10};
  padding-left: 4px;
  line-height: 16px;
`;

const StepWrapper = styled.div`
  display: flex;
  flex: 1;
  height: 6px;
  position: relative;
  margin: 0px -2px;
`;

const StepContainer = styled.div`
  flex: 1;
  background: #e8e8e8;
  margin: 0px 1px;
`;

const getProgressPosition = (
  percentage: number,
  stepSize: number,
  currentStep: number,
) => {
  const currStepProgress = percentage - stepSize * currentStep;
  if (currStepProgress > stepSize) {
    return 100;
  } else if (currStepProgress < 0) {
    return 0;
  } else if (currStepProgress <= stepSize) {
    return (currStepProgress / stepSize) * 100;
  } else {
    // just placeholder for typescript
    return 0;
  }
};

function StepProgressBar(props: ProgressBarComponentProps) {
  const { steps } = props;
  const stepSize = 100 / steps;

  return (
    <StepWrapper>
      {[...Array(Number(props.steps))].map((_, index) => {
        const width = getProgressPosition(
          Number(props.progress),
          stepSize,
          index,
        );
        return (
          <StepContainer key={index}>
            <ProgressBar
              data-cy={width}
              fillColor={props.fillColor}
              progress={width}
            />
          </StepContainer>
        );
      })}
    </StepWrapper>
  );
}

function ProgressBarComponent(props: ProgressBarComponentProps) {
  const isDeterminate =
    props.barType === BarType.DETERMINATE && !isNaN(Number(props.steps));
  return (
    <ProgressBarWrapper className="t--progressbar-widget">
      {isDeterminate ? (
        <StepProgressBar {...props} />
      ) : (
        <ProgressBar
          borderRadius={props.borderRadius}
          data-cy={props.progress}
          fillColor={props.fillColor}
          progress={props.progress}
        />
      )}
      {props.showResult && <Label>{props.progress}%</Label>}
    </ProgressBarWrapper>
  );
}
export interface ProgressBarComponentProps {
  progress?: number;
  showResult: boolean;
  fillColor: string;
  barType: BarType;
  steps: number;
  borderRadius?: string;
}

export default ProgressBarComponent;
