import React from "react";
import styled from "styled-components";

import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { FlexLayerLayoutData } from "utils/autoLayout/autoLayoutTypes";
import { MOBILE_ROW_GAP, ROW_GAP } from "utils/autoLayout/constants";

/**
 * If FlexLayer hasFillWidget:
 * then render all children directly within the AutoLayoutLayer (row / flex-start / wrap);
 * no need for alignments.
 *
 * Else:
 * render children in 3 alignments: start, center and end.
 * Each alignment has following characteristcs:
 * 1. Mobile viewport:
 *   - flex-wrap: wrap.
 *   - flex-basis: auto.
 *   ~ This ensures the alignment takes up as much space as needed by the children.
 *   ~ It can stretch to the full width of the viewport.
 *   ~ or collapse completely if there is no content.
 *
 * 2. Larger viewports:
 *  - flex-wrap: nowrap.
 *  - flex-basis: 0%.
 *  ~ This ensures that alignments share the total space equally, until possible.
 *  ~ Soon as the content in any alignment needs more space, it will wrap to the next line
 *    thanks to flex wrap in AutoLayoutLayer.
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
  flex-wrap: ${({ isMobile }) => (isMobile ? "wrap" : "nowrap")};
  row-gap: ${(isMobile) => (isMobile ? MOBILE_ROW_GAP : ROW_GAP)}px;
  column-gap: ${WIDGET_PADDING}px;
  border: 1px dashed red;
  flex-grow: 1;
  flex-shrink: 1;
  border: 1px dotted red;
  flex-basis: ${({ isMobile }) => (isMobile ? "auto" : "0%")};
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
