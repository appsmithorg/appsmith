import React, { ReactNode } from "react";
import styled from "styled-components";

/**
 * 1. Each row in a FlexBoxComponent (Column) is wrapped in an AutoLayoutLayer.
 * 2. It employs a row flex to layout three child row flexes called alignments (start, center and end).
 * Together these allow to horizontally align widgets inside a Vertical Stack.
 * 3. On mobile viewport, if an alignment requires > 64 columns, then it used flex wrap to neatly place the widgets into subsequent rows.
 */

export interface AutoLayoutLayerProps {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
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
