import React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { BarType } from "../constants";
import { isNaN } from "lodash";

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

const StepWrapper = styled.div`
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  position: relative;
`;

const StepContainer = styled.div<{ steps: number; fillColor: string }>`
  position: absolute;
  content: "";
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;

  & > .step {
    width: ${(props) =>
      Number(props.steps)
        ? `calc(${100 / Number(props.steps)}% - 2px)`
        : "100%"};
    margin-right: 2px;
    transition: width 0.4s ease;

    :last-child {
      width: ${(props) =>
        Number(props.steps) ? `${100 / Number(props.steps)}%` : "100%"};
      margin-right: 0px;
    }

    &.active {
      background: ${({ fillColor }) => fillColor};
    }
  }
`;

function ProgressBarComponent(props: ProgressBarComponentProps) {
  const isDeterminate =
    props.barType === BarType.DETERMINATE && !isNaN(Number(props.steps));
  let current = 1;
  if (
    isDeterminate &&
    !isNaN(Number(props.steps)) &&
    !isNaN(Number(props.progress))
  ) {
    current = Math.round(Number(props.steps) * (Number(props.progress) / 100));
  }
  return (
    <ProgressBarWrapper className="t--progressbar-widget">
      {isDeterminate ? (
        <StepWrapper>
          <StepContainer
            fillColor={props.fillColor}
            steps={Number(props.steps)}
          >
            {[...Array(Number(props.steps))].map((_, index) => (
              <div
                className={`step ${index < current ? "active" : ""}`}
                key={index}
              />
            ))}
          </StepContainer>
        </StepWrapper>
      ) : (
        <ProgressBar
          data-cy={props.progress}
          fillColor={props.fillColor}
          progress={props.progress}
        />
      )}
      {props.barType === BarType.DETERMINATE && props.showResult && (
        <Label>{props.progress}%</Label>
      )}
    </ProgressBarWrapper>
  );
}
export interface ProgressBarComponentProps {
  progress?: number;
  showResult: boolean;
  fillColor: string;
  barType: BarType;
  steps?: number;
}

export default ProgressBarComponent;
