import React, { ReactNode } from "react";
import styled from "styled-components";

import { FlexDirection, LayoutDirection } from "components/constants";

/**
 * 1. Given a direction if should employ flex in perpendicular direction.
 * 2. It should be able to render children within three nested wrappers for start, center and end alignment.
 * 3. Only render start wrapper if a fill widget is present.
 */

export interface AutoLayoutLayerProps {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  direction: LayoutDirection;
  flexGap: number;
  hasFillChild?: boolean;
  index: number;
  widgetId: string;
  isMobile?: boolean;
  isCurrentCanvasDragging: boolean;
  wrapStart: boolean;
  wrapCenter: boolean;
  wrapEnd: boolean;
  wrapLayer: boolean;
}

const LayoutLayerContainer = styled.div<{
  flexDirection: FlexDirection;
  flexGap: number;
  isCurrentCanvasDragging: boolean;
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || FlexDirection.Row};
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: ${({ wrap }) => (wrap ? "wrap" : "nowrap")};
  gap: ${({ flexGap }) => `${flexGap}px`};
  width: 100%;
`;

const SubWrapper = styled.div<{
  isCurrentCanvasDragging: boolean;
  flexDirection: FlexDirection;
  flexGap: number;
  wrap?: boolean;
}>`
  flex: ${({ wrap }) => `1 1 ${wrap ? "100" : "33.3"}%`};
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  align-items: flex-start;
  align-self: stretch;
  flex-wrap: ${({ wrap }) => (wrap ? "wrap" : "nowrap")};
  gap: ${({ flexGap }) => `${flexGap}px`};
`;

const StartWrapper = styled(SubWrapper)`
  justify-content: flex-start;
`;

const EndWrapper = styled(SubWrapper)`
  justify-content: flex-end;
`;

const CenterWrapper = styled(SubWrapper)`
  justify-content: center;
`;

function getFlexDirection(direction: LayoutDirection): FlexDirection {
  return direction === LayoutDirection.Horizontal
    ? FlexDirection.Row
    : FlexDirection.Column;
}

function getInverseDirection(direction: LayoutDirection): LayoutDirection {
  return direction === LayoutDirection.Horizontal
    ? LayoutDirection.Vertical
    : LayoutDirection.Horizontal;
}

function AutoLayoutLayer(props: AutoLayoutLayerProps) {
  const flexDirection = getFlexDirection(getInverseDirection(props.direction));

  return (
    <LayoutLayerContainer
      className={`auto-layout-layer-${props.widgetId}-${props.index}`}
      flexDirection={flexDirection}
      flexGap={props.flexGap}
      isCurrentCanvasDragging={props.isCurrentCanvasDragging}
      wrap={props.isMobile && props.wrapLayer}
    >
      {props.start && (
        <StartWrapper
          flexDirection={flexDirection}
          flexGap={props.flexGap}
          isCurrentCanvasDragging={props.isCurrentCanvasDragging}
          wrap={props.wrapStart && props.isMobile}
        >
          {props.start}
        </StartWrapper>
      )}
      {props.center && (
        <CenterWrapper
          flexDirection={flexDirection}
          flexGap={props.flexGap}
          isCurrentCanvasDragging={props.isCurrentCanvasDragging}
          wrap={props.wrapCenter && props.isMobile}
        >
          {props.center}
        </CenterWrapper>
      )}
      {props.end && (
        <EndWrapper
          flexDirection={flexDirection}
          flexGap={props.flexGap}
          isCurrentCanvasDragging={props.isCurrentCanvasDragging}
          wrap={props.wrapEnd && props.isMobile}
        >
          {props.end}
        </EndWrapper>
      )}
    </LayoutLayerContainer>
  );
}

export default AutoLayoutLayer;
