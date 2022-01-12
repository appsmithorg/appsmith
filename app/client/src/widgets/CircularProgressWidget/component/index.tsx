import * as React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const VIEWBOX_HEIGHT_HALF = 50;
const VIEWBOX_CENTER_X = 50;
const VIEWBOX_CENTER_Y = 50;
const STROKE_WIDTH = 8;
const MAX_VALUE = 100;

export enum StrokeLineCapTypes {
  round = "round",
  butt = "butt",
}

export type StrokeLineCap = keyof typeof StrokeLineCapTypes;

export interface CircularProgressComponentProps {
  counterClockwise: boolean;
  strokeLineCap: StrokeLineCap;
  fillColor: string;
  progress: number;
  showResult: boolean;
}

const SvgContainer = styled.svg`
  width: 100%;
  height: 100%;
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

function CircularProgressComponent({
  counterClockwise,
  fillColor = Colors.GREEN,
  progress,
  showResult = true,
  strokeLineCap = StrokeLineCapTypes.round,
}: CircularProgressComponentProps) {
  const pathRadius = VIEWBOX_HEIGHT_HALF - STROKE_WIDTH / 2;
  const pathRatio = progress / MAX_VALUE;

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
        <Label x={VIEWBOX_CENTER_X} y={VIEWBOX_CENTER_Y}>
          {`${Math.round((progress / MAX_VALUE) * 100)}%`}
        </Label>
      )}
    </SvgContainer>
  );
}

export default CircularProgressComponent;
