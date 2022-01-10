import * as React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const VIEWBOX_HEIGHT_HALF = 50;
const VIEWBOX_CENTER_X = 50;
const VIEWBOX_CENTER_Y = 50;

export enum StrokeLineCapTypes {
  round = "round",
  butt = "butt",
}

export type StrokeLineCap = keyof typeof StrokeLineCapTypes;

export interface CircularProgressComponentProps {
  backgroundPadding: number;
  backgroundColor?: string;
  counterClockwise: boolean;
  successValue: number;
  strokeLineCap: StrokeLineCap;
  successColor: string;
  successTextColor: string;
  maxValue: number;
  pathColor: string;
  strokeWidth: number;
  trailColor: string;
  textColor: string;
  textSize: string;
  value: number;
}

const SvgContainer = styled.svg`
  width: 100%;
  height: 100%;
`;

export const Path = styled.path<
  Pick<CircularProgressComponentProps, "pathColor" | "strokeLineCap">
>`
  stroke: ${(props) => props.pathColor};
  stroke-linecap: ${(props) => props.strokeLineCap};
  transition: stroke-dashoffset 0.5s ease 0s;
`;

export const Trail = styled.path<
  Pick<CircularProgressComponentProps, "trailColor">
>`
  stroke: ${(props) => props.trailColor};
`;

export const Label = styled.text<
  Pick<CircularProgressComponentProps, "textColor" | "textSize">
>`
  fill: ${(props) => props.textColor};
  font-size: ${(props) => `${props.textSize}px`};
  dominant-baseline: middle;
  text-anchor: middle;
`;

export const Circle = styled.circle<
  Pick<CircularProgressComponentProps, "backgroundColor">
>`
  fill: ${(props) => props.backgroundColor};
`;

function CircularProgressComponent({
  backgroundPadding,
  backgroundColor = Colors.WHITE,
  strokeLineCap = StrokeLineCapTypes.round,
  successTextColor,
  successColor,
  successValue,
  counterClockwise,
  maxValue,
  pathColor,
  strokeWidth,
  textSize,
  textColor,
  trailColor,
  value,
}: CircularProgressComponentProps) {
  const pathRadius = VIEWBOX_HEIGHT_HALF - strokeWidth / 2 - backgroundPadding;
  const pathRatio = value / maxValue;

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
      data-test-id="CircularProgressbar"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <Circle
        backgroundColor={backgroundColor}
        cx={VIEWBOX_CENTER_X}
        cy={VIEWBOX_CENTER_Y}
        r={VIEWBOX_HEIGHT_HALF}
      />
      <Trail
        d={drawPath()}
        fillOpacity={0}
        strokeWidth={strokeWidth}
        style={drawDashStyle()}
        trailColor={trailColor}
      />
      <Path
        d={drawPath()}
        fillOpacity={0}
        pathColor={value >= successValue ? successColor : pathColor}
        strokeLineCap={strokeLineCap}
        strokeWidth={strokeWidth}
        style={drawDashStyle(pathRatio)}
      />
      <Label
        textColor={value >= successValue ? successTextColor : textColor}
        textSize={textSize}
        x={VIEWBOX_CENTER_X}
        y={VIEWBOX_CENTER_Y}
      >
        {`${(value / maxValue) * 100}%`}
      </Label>
    </SvgContainer>
  );
}

export default CircularProgressComponent;
