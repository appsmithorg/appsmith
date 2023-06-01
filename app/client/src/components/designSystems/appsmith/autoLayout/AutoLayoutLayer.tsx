import React from "react";
import styled from "styled-components";

import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { FlexLayerLayoutData } from "utils/autoLayout/autoLayoutTypes";
import { MOBILE_ROW_GAP, ROW_GAP } from "utils/autoLayout/constants";

/**
 * 1. Given a direction if should employ flex in perpendicular direction.
 * 2. It should be able to render children within three nested wrappers for start, center and end alignment.
 * 3. Only render start wrapper if a fill widget is present.
 */

export type AutoLayoutLayerProps = FlexLayerLayoutData & {
  index: number;
  isMobile?: boolean;
  widgetId: string;
};

const RowContainer = styled.div<{
  isMobile?: boolean;
}>`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
  overflow: visible;
  width: 100%;
  row-gap: ${(isMobile) => (isMobile ? MOBILE_ROW_GAP : ROW_GAP)}px;
  column-gap: ${WIDGET_PADDING}px;
`;

const Alignment = styled.div<{
  isMobile?: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  align-self: stretch;
  flex-wrap: wrap;
  row-gap: ${(isMobile) => (isMobile ? MOBILE_ROW_GAP : ROW_GAP)}px;
  column-gap: ${WIDGET_PADDING}px;
  border: 1px dashed red;
  flex-grow: 1;
  flex-shrink: 1;
`;

const StartAlignment = styled(Alignment)`
  justify-content: flex-start;
`;

const EndAlignment = styled(Alignment)`
  justify-content: flex-end;
`;

const CenterAlignment = styled(Alignment)`
  justify-content: center;
`;

function AutoLayoutLayer(props: AutoLayoutLayerProps) {
  const renderChildren = () => {
    const {
      centerChildren,
      endChildren,
      hasFillWidget,
      isMobile,
      startChildren,
    } = props;

    /**
     * If flex layer has a fill widget,
     * then we need to render all children in a single alignment (start).
     */
    if (hasFillWidget) return startChildren;

    const arr: (JSX.Element | null)[] = [
      <StartAlignment isMobile={isMobile} key={0}>
        {startChildren}
      </StartAlignment>,
      <CenterAlignment isMobile={isMobile} key={1}>
        {centerChildren}
      </CenterAlignment>,
      <EndAlignment isMobile={isMobile} key={2}>
        {endChildren}
      </EndAlignment>,
    ];

    return arr;
  };
  return (
    <RowContainer className={`flex-row-${props.widgetId}-${props.index}`}>
      {renderChildren()}
    </RowContainer>
  );
}

export default AutoLayoutLayer;
