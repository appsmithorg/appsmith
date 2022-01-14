import * as React from "react";
import styled from "styled-components";
import isNaN from "lodash/isNaN";
import range from "lodash/range";

import { Colors } from "constants/Colors";
import {
  BarType,
  StrokeLineCapTypes,
  MAX_VALUE,
  STROKE_WIDTH,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
  VIEWBOX_HEIGHT_HALF,
  VIEWBOX_CENTER_X,
  VIEWBOX_CENTER_Y,
} from "../constants";

export type StrokeLineCap = keyof typeof StrokeLineCapTypes;

export interface CircularProgressComponentProps {
  barType: BarType;
  counterClockwise: boolean;
  strokeLineCap: StrokeLineCap;
  fillColor: string;
  progress: number;
  showResult: boolean;
  steps: number;
}

const CircularProgressContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const SvgContainer = styled.svg`
  width: 100%;
  height: 100%;
  vertical-align: middle;
`;

export const Circle = styled.circle`
  fill: transparent;
`;

export const Trail = styled.path`
  stroke: ${Colors.MERCURY};
`;

export const Path = styled.path<
  Pick<CircularProgressComponentProps, "fillColor" | "strokeLineCap">
>`
  stroke: ${(props) => props.fillColor};
  stroke-linecap: ${(props) => props.strokeLineCap};
  transition: stroke-dashoffset 0.5s ease 0s;
`;

export const Label = styled.text`
  fill: ${Colors.THUNDER};
  font-size: 20px;
  dominant-baseline: middle;
  text-anchor: middle;
`;

const StepsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StepLine = styled.div<{ rotate: number }>`
  position: absolute;
  height: 100%;
  transform: ${(props) => `rotate(${props.rotate}turn)`};
`;
const Seperator = styled.div`
  background: ${Colors.WHITE};
  width: 4px;

  height: ${STROKE_WIDTH}%;
`;

function CircularProgressComponent({
  barType,
  counterClockwise,
  fillColor = Colors.GREEN,
  progress = 0,
  showResult = true,
  strokeLineCap = StrokeLineCapTypes.round,
  steps,
}: CircularProgressComponentProps) {
  const pathRadius = VIEWBOX_HEIGHT_HALF - STROKE_WIDTH / 2;
  const pathRatio = progress / MAX_VALUE;

  const isDeterminate =
    barType === BarType.DETERMINATE && !isNaN(Number(steps));

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
    <CircularProgressContainer>
      <SvgContainer
        data-test-id="CircularProgressbar"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <Circle
          cx={VIEWBOX_CENTER_X}
          cy={VIEWBOX_CENTER_Y}
          r={VIEWBOX_HEIGHT_HALF}
        />
        <Trail
          d={drawPath()}
          fillOpacity={0}
          strokeWidth={STROKE_WIDTH}
          style={drawDashStyle()}
        />
        <Path
          d={drawPath()}
          fillColor={fillColor}
          fillOpacity={0}
          strokeLineCap={strokeLineCap}
          strokeWidth={STROKE_WIDTH}
          style={drawDashStyle(pathRatio)}
        />
        {showResult && (
          <Label x={VIEWBOX_CENTER_X} y={VIEWBOX_CENTER_Y} z={100}>
            {`${Math.round((progress / MAX_VALUE) * 100)}%`}
          </Label>
        )}
      </SvgContainer>
      {isDeterminate && steps >= 2 && (
        <StepsContainer>
          {range(steps).map((index) => (
            <StepLine key={index} rotate={index * (1 / steps)}>
              <Seperator />
            </StepLine>
          ))}
        </StepsContainer>
      )}
    </CircularProgressContainer>
  );
}

export default CircularProgressComponent;
