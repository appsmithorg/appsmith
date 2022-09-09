import * as React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import {
  MAX_VALUE,
  STROKE_WIDTH,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
  VIEWBOX_HEIGHT_HALF,
  VIEWBOX_CENTER_X,
  VIEWBOX_CENTER_Y,
} from "../constants";

export interface CircularProgressComponentProps {
  counterClockwise: boolean;
  fillColor: string;
  progress: number;
  showResult: boolean;
  borderRadius?: string;
}

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
  Pick<CircularProgressComponentProps, "fillColor">
>`
  stroke: ${(props) => props.fillColor};
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
  progress = 0,
  showResult = true,
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
        strokeWidth={STROKE_WIDTH}
        style={drawDashStyle(pathRatio)}
      />
      {showResult && !isNaN(progress) && (
        <Label x={VIEWBOX_CENTER_X} y={VIEWBOX_CENTER_Y}>
          {`${Math.round((progress / MAX_VALUE) * 100)}%`}
        </Label>
      )}
    </SvgContainer>
  );
}

export default CircularProgressComponent;
