import React from "react";
import styled, { css, keyframes } from "styled-components";

import { Colors } from "constants/Colors";
import {
  INDETERMINATE_SIZE,
  INDETERMINATE_THICKNESS,
  LINEAR_PROGRESS_HEIGHT_RATIO,
  MAX_VALUE,
  ProgressType,
  ProgressVariant,
  STROKE_WIDTH,
  VIEWBOX_CENTER_X,
  VIEWBOX_CENTER_Y,
  VIEWBOX_HEIGHT,
  VIEWBOX_HEIGHT_HALF,
  VIEWBOX_WIDTH,
} from "../constants";
import _ from "lodash";

// Utilities
// Conditional render method
const renderProgress = (props: ProgressComponentProps) => {
  const { fillColor, steps, type, value, variant } = props;

  if (type === ProgressType.CIRCULAR) {
    if (variant === ProgressVariant.DETERMINATE) {
      // With steps
      if (steps > 1) {
        return (
          <CircularProgressWithSteps {...props}>
            <RadialSeparators steps={steps} />
          </CircularProgressWithSteps>
        );
      }
    }
    // Pure circular progress
    return <CircularProgress {...props} />;
  }
  // Linear progress components
  if (variant === ProgressVariant.DETERMINATE) {
    // With steps
    if (steps > 1) {
      return <LinearProgressWithSteps {...props} />;
    }
    // Pure linear progress
    return (
      <DeterminateLinearProgress
        borderRadius={props.borderRadius}
        data-cy={value}
        fillColor={fillColor}
        value={value}
      />
    );
  }
  // Indeterminate linear progress component
  return (
    <IndeterminateLinearProgress
      borderRadius={props.borderRadius}
      fillColor={fillColor}
    />
  );
};

// Calculate current step's progress ratio
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

// Animations
const rotate = keyframes`
  100%{
    transform: rotate(360deg);
  }
`;
const rotateAnimation = css`
  animation: ${rotate} 2s linear infinite;
`;

const dash = keyframes`
  0%{
    stroke-dasharray: 1,200;
    stroke-dashoffset: 0;
  }
  50%{
    stroke-dasharray: 89,200;
    stroke-dashoffset: -35;
  }
  100%{
    stroke-dasharray: 89,200;
    stroke-dashoffset: -124;
  }
`;
const dashAnimation = css`
  animation: ${dash} 1.4s ease-in-out infinite;
`;

const flow = keyframes`
  0% {
    transform:  translateX(0) scaleX(0);
  }
  40% {
    transform:  translateX(0) scaleX(0.4);
  }
  100% {
    transform:  translateX(100%) scaleX(0.5);
  }
`;
const flowAnimation = css`
  animation: ${flow} 1s infinite linear;
`;

// UI components
const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
`;

// Determinate Linear progress
const DeterminateLinearProgress = styled.div<{
  value?: number;
  fillColor: string;
  withSteps?: boolean;
  borderRadius?: string;
}>`
  flex: 1;
  height: ${({ withSteps }) =>
    withSteps ? 100 : LINEAR_PROGRESS_HEIGHT_RATIO}%;
  background: #e8e8e8;
  position: relative;
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;

  &:after {
    background: ${({ fillColor }) => fillColor};
    ${({ value }) => value && `width: ${value}%`};
    transition: width 0.4s ease;
    position: absolute;
    content: "";
    left: 0;
    top: 0;
    bottom: 0;
  }
`;

const IndeterminateLinearProgressContainer = styled.div<{
  borderRadius: string;
}>`
  height: ${LINEAR_PROGRESS_HEIGHT_RATIO}%;
  width: 100%;
  background: #e8e8e8;
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;
`;

const IndeterminateLinearProgressValue = styled.div<{
  fillColor: string;
}>`
  width: 100%;
  height: 100%;
  ${({ fillColor }) => fillColor && `background: ${fillColor}`};
  ${flowAnimation}
  transform-origin: 0% 50%;
`;

// Indeterminate Linear Progress
function IndeterminateLinearProgress({
  borderRadius,
  fillColor,
}: {
  fillColor: string;
  borderRadius: string;
}) {
  return (
    <IndeterminateLinearProgressContainer borderRadius={borderRadius}>
      <IndeterminateLinearProgressValue
        data-cy="indeterminate-linear-progress"
        fillColor={fillColor}
      />
    </IndeterminateLinearProgressContainer>
  );
}

// Label for linear progress
const LinearProgressLabel = styled.div`
  font-size: 14px;
  color: ${Colors.GREY_10};
  padding-left: 4px;
  line-height: 16px;
`;

const StepWrapper = styled.div`
  display: flex;
  flex: 1;
  height: ${LINEAR_PROGRESS_HEIGHT_RATIO}%;
  position: relative;
  margin: 0px -2px;
`;

const StepContainer = styled.div`
  flex: 1;
  background: #e8e8e8;
  margin: 0px 1px;
`;

// Linear Progress with steps
function LinearProgressWithSteps(props: ProgressComponentProps) {
  const { steps, value } = props;
  const stepSize = 100 / steps;

  return (
    <StepWrapper>
      {[...Array(Number(steps))].map((_, index) => {
        const width = getProgressPosition(Number(value), stepSize, index);
        return (
          <StepContainer data-cy="step" key={index}>
            <DeterminateLinearProgress
              borderRadius={props.borderRadius}
              data-cy={width}
              fillColor={props.fillColor}
              value={width}
              withSteps
            />
          </StepContainer>
        );
      })}
    </StepWrapper>
  );
}

const SvgContainer = styled.svg<{ variant: ProgressVariant }>`
  width: 100%;
  height: 100%;
  vertical-align: middle;
  ${({ variant }) =>
    variant === ProgressVariant.INDETERMINATE && rotateAnimation}
`;

export const Circle = styled.circle<{
  variant: ProgressVariant;
  fillColor: string;
}>`
  fill: transparent;
  ${({ variant }) => variant === ProgressVariant.INDETERMINATE && dashAnimation}
  ${({ fillColor, variant }) =>
    variant === ProgressVariant.INDETERMINATE &&
    `
    stroke-dasharray: 1,200;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    stroke: ${fillColor};
    stroke-width: ${INDETERMINATE_THICKNESS};
  `}
`;

export const Trail = styled.path`
  stroke: ${Colors.MERCURY};
`;

export const Path = styled.path<{
  fillColor: string;
}>`
  stroke: ${(props) => props.fillColor};
  stroke-linecap: butt;
  transition: stroke-dashoffset 0.5s ease 0s;
`;

export const Label = styled.text`
  fill: ${Colors.THUNDER};
  font-size: 20px;
  dominant-baseline: middle;
  text-anchor: middle;
`;

export const CircularProgressWithStepsWrapper = styled.div<{
  isScaleY: boolean;
}>`
  width: 100%;
  height: ${({ isScaleY }) => (isScaleY ? `auto` : `100%`)};
`;

export const CircularProgressWithStepsContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const CircularProgressWithStepsOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
`;

const SeparatorContainer = styled.div<{ turns: number }>`
  position: absolute;
  height: 100%;
  ${({ turns }) => turns && `transform: rotate(${turns}turn)`};
`;

const SeparatorOverlay = styled.div`
  background: #fff;
  width: 2px;
  height: ${STROKE_WIDTH}%;
`;

function Separator(props: { turns: number }) {
  const { turns } = props;

  return (
    <SeparatorContainer turns={turns}>
      <SeparatorOverlay data-cy="separator" />
    </SeparatorContainer>
  );
}

function RadialSeparators(props: { steps: number }) {
  const { steps } = props;
  const turns = 1 / steps;
  return (
    <>
      {_.range(steps).map((index) => (
        <Separator key={index} turns={index * turns} />
      ))}
    </>
  );
}
// Pure circular progress (indeterminate/determinate)
function CircularProgress(props: ProgressComponentProps) {
  const {
    counterClockwise,
    fillColor,
    showResult,
    value: originalValue,
    variant,
  } = props;
  const value =
    originalValue > 100 ? 100 : originalValue < 0 ? 0 : originalValue;
  const pathRadius = VIEWBOX_HEIGHT_HALF - STROKE_WIDTH / 2;
  const pathRatio = value / MAX_VALUE;

  function drawPath() {
    const rotation = counterClockwise ? 1 : 0;

    // Move to center of canvas
    // Relative move to top canvas
    // Relative arc to bottom of canvas
    // Relative arc to top of canvas
    return `
        M ${VIEWBOX_CENTER_X},${VIEWBOX_CENTER_Y}
        m 0,-${pathRadius}
        a ${pathRadius},${pathRadius} ${rotation} 1 1 0,${2 * pathRadius}
        a ${pathRadius},${pathRadius} ${rotation} 1 1 0,-${2 * pathRadius}
      `;
  }

  function drawDashStyle(dashRatio = 1) {
    const diameter = Math.PI * 2 * pathRadius;
    const gapLength = (1 - dashRatio) * diameter;

    return {
      // Have dash be full diameter, and gap be full diameter
      strokeDasharray: `${diameter}px ${diameter}px`,
      // Shift dash backward by gapLength, so gap starts appearing at correct distance
      strokeDashoffset: `${counterClockwise ? -gapLength : gapLength}px`,
    };
  }

  return (
    <SvgContainer
      data-cy="circular"
      variant={variant}
      viewBox={
        variant === ProgressVariant.INDETERMINATE
          ? `${INDETERMINATE_SIZE / 2} ${INDETERMINATE_SIZE /
              2} ${INDETERMINATE_SIZE} ${INDETERMINATE_SIZE}`
          : `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`
      }
    >
      <Circle
        cx={
          variant === ProgressVariant.INDETERMINATE
            ? INDETERMINATE_SIZE
            : VIEWBOX_CENTER_X
        }
        cy={
          variant === ProgressVariant.INDETERMINATE
            ? INDETERMINATE_SIZE
            : VIEWBOX_CENTER_Y
        }
        fillColor={fillColor}
        r={
          variant === ProgressVariant.INDETERMINATE
            ? (INDETERMINATE_SIZE - INDETERMINATE_THICKNESS) / 2
            : VIEWBOX_HEIGHT_HALF
        }
        variant={variant}
      />

      {variant === ProgressVariant.DETERMINATE && (
        <>
          <Trail
            d={drawPath()}
            fillOpacity={0}
            strokeWidth={STROKE_WIDTH}
            style={drawDashStyle()}
          />

          <Path
            d={drawPath()}
            data-testvalue={value}
            fillColor={fillColor}
            fillOpacity={0}
            strokeWidth={STROKE_WIDTH}
            style={drawDashStyle(pathRatio)}
          />

          {showResult && !isNaN(value) && (
            <Label
              data-cy="circular-label"
              x={VIEWBOX_CENTER_X}
              y={VIEWBOX_CENTER_Y}
            >
              {`${value}%`}
            </Label>
          )}
        </>
      )}
    </SvgContainer>
  );
}

// Circular progress with steps
function CircularProgressWithSteps(
  props: ProgressComponentProps & { children?: React.ReactNode },
) {
  const { children, ...circularProgressProps } = props;

  return (
    <CircularProgressWithStepsWrapper isScaleY={circularProgressProps.isScaleY}>
      <CircularProgressWithStepsContainer>
        <CircularProgress {...circularProgressProps} />
        {children && (
          <CircularProgressWithStepsOverlay>
            {children}
          </CircularProgressWithStepsOverlay>
        )}
      </CircularProgressWithStepsContainer>
    </CircularProgressWithStepsWrapper>
  );
}

// Main component
function ProgressComponent(props: ProgressComponentProps) {
  const { showResult, type, variant } = props;
  return (
    <ProgressContainer>
      {renderProgress(props)}
      {variant === ProgressVariant.DETERMINATE &&
        type === ProgressType.LINEAR &&
        showResult && <LinearProgressLabel>{props.value}%</LinearProgressLabel>}
    </ProgressContainer>
  );
}

export interface ProgressComponentProps {
  type: ProgressType;
  variant: ProgressVariant;
  value: number;
  steps: number;
  showResult: boolean;
  counterClockwise: boolean;
  fillColor: string;
  isScaleY: boolean;
  borderRadius: string;
}

export default ProgressComponent;
