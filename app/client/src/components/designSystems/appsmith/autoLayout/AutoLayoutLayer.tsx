import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";

import type { LayoutDirection } from "utils/autoLayout/constants";

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
  index: number;
  widgetId: string;
  isMobile?: boolean;
  wrapStart: boolean;
  wrapCenter: boolean;
  wrapEnd: boolean;
  wrapLayer: boolean;
}

const LayoutLayerContainer = styled.div<{
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: ${({ wrap }) => (wrap ? "wrap" : "nowrap")};

  width: 100%;
`;

const SubWrapper = styled.div<{
  wrap?: boolean;
}>`
  flex: ${({ wrap }) => `1 1 ${wrap ? "100" : "33.3333"}%`};
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  align-self: stretch;
  flex-wrap: ${({ wrap }) => (wrap ? "wrap" : "nowrap")};
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

function AutoLayoutLayer(props: AutoLayoutLayerProps) {
  return (
    <LayoutLayerContainer
      className={`auto-layout-layer-${props.widgetId}-${props.index}`}
      wrap={props.isMobile && props.wrapLayer}
    >
      <StartWrapper wrap={props.wrapStart && props.isMobile}>
        {props.start}
      </StartWrapper>
      <CenterWrapper wrap={props.wrapCenter && props.isMobile}>
        {props.center}
      </CenterWrapper>
      <EndWrapper wrap={props.wrapEnd && props.isMobile}>
        {props.end}
      </EndWrapper>
    </LayoutLayerContainer>
  );
}

export default AutoLayoutLayer;
