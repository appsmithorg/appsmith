import React, { ReactNode, useCallback } from "react";
import styled from "styled-components";

import { LayoutDirection, ResponsiveBehavior } from "components/constants";
import {
  WidgetType,
  widgetTypeClassname,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { snipingModeSelector } from "selectors/editorSelectors";
import { useSelector } from "store";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { checkIsDropTarget } from "../PositionedContainer";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { AppState } from "ce/reducers";

export type AutoLayoutProps = {
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  direction?: LayoutDirection;
  focused?: boolean;
  minWidth?: number;
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  widgetId: string;
  widgetType: WidgetType;
};

const FlexWidget = styled.div<{
  componentHeight: number;
  componentWidth: number;
  isMobile: boolean;
  isFillWidget: boolean;
  minWidth?: string;
  padding: number;
  zIndex: number;
  zIndexOnHover: number;
  isCurrentCanvasDragging: boolean;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex};

  width: ${({ componentWidth, isFillWidget }) =>
    isFillWidget ? "auto" : `${Math.floor(componentWidth)}px`};
  height: ${({ componentHeight, isMobile }) =>
    isMobile ? "100%" : Math.floor(componentHeight) + "px"};
  min-width: ${({ minWidth }) => minWidth};
  min-height: 30px;
  padding: ${({ isMobile, padding }) =>
    isMobile ? `${padding}px 1px 0` : padding + "px"};

  flex-grow: ${({ isFillWidget }) => (isFillWidget ? "1" : "0")};

  &:hover {
    z-index: ${({ zIndexOnHover }) => zIndexOnHover} !important;
  }
  margin: ${({ isCurrentCanvasDragging }) =>
    isCurrentCanvasDragging ? "6px" : 0};
  transition: margin 10ms;
`;

// TODO: update min width logic.

export function FlexComponent(props: AutoLayoutProps) {
  const isMobile = useIsMobileDevice();
  const isSnipingMode = useSelector(snipingModeSelector);
  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(() => {
    clickToSelectWidget(props.widgetId);
  }, [props.widgetId, clickToSelectWidget]);

  const { dragDetails } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );

  const isCurrentCanvasDragging = dragDetails?.draggedOn !== undefined;

  const isDropTarget = checkIsDropTarget(props.widgetType);
  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    props.focused,
    props.selected,
  );

  const stopEventPropagation = (e: any) => {
    !isSnipingMode && e.stopPropagation();
  };
  /**
   * In a vertical stack,
   * Fill widgets grow / shrink to take up all the available space.
   * => width: auto && flex-grow: 1;
   */
  const isFillWidget: boolean =
    props.direction === LayoutDirection.Vertical &&
    props.responsiveBehavior === ResponsiveBehavior.Fill;
  const className = `auto-layout-parent-${props.parentId} auto-layout-child-${
    props.widgetId
  } ${widgetTypeClassname(props.widgetType)}`;

  const minWidth =
    props.responsiveBehavior === ResponsiveBehavior.Fill && isMobile
      ? "100%"
      : props.minWidth + "px";

  return (
    <FlexWidget
      className={className}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      id={props.widgetId}
      isCurrentCanvasDragging={isCurrentCanvasDragging}
      isFillWidget={isFillWidget}
      isMobile={isMobile}
      minWidth={minWidth}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      padding={WIDGET_PADDING}
      zIndex={zIndex}
      zIndexOnHover={onHoverZIndex}
    >
      {props.children}
    </FlexWidget>
  );
}

export default FlexComponent;
