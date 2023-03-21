import { GridDefaults } from "constants/WidgetConstants";
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
  startColumns: number;
  centerColumns: number;
  endColumns: number;
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
  const renderChildren = () => {
    const {
      center,
      centerColumns,
      end,
      endColumns,
      isMobile,
      start,
      startColumns,
    } = props;
    const arr: (JSX.Element | null)[] = [
      <StartWrapper key={0} wrap={props.wrapStart && props.isMobile}>
        {start}
      </StartWrapper>,
      <CenterWrapper key={1} wrap={props.wrapCenter && props.isMobile}>
        {center}
      </CenterWrapper>,
      <EndWrapper key={2} wrap={props.wrapEnd && props.isMobile}>
        {end}
      </EndWrapper>,
    ];
    const isFull =
      startColumns + centerColumns + endColumns ===
        GridDefaults.DEFAULT_GRID_COLUMNS && !isMobile;
    if (isFull) {
      if (startColumns === 0) arr[0] = null;
      if (centerColumns === 0) arr[1] = null;
      if (endColumns === 0) arr[2] = null;
    }
    return arr.filter((item) => item !== null);
  };
  return (
    <LayoutLayerContainer
      className={`auto-layout-layer-${props.widgetId}-${props.index}`}
      wrap={props.isMobile && props.wrapLayer}
    >
      {renderChildren()}
    </LayoutLayerContainer>
  );
}

export default AutoLayoutLayer;
