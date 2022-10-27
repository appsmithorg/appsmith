import React, { ReactNode, useCallback } from "react";
import styled from "styled-components";

import { LayoutDirection, ResponsiveBehavior } from "components/constants";
import { WidgetType, widgetTypeClassname } from "constants/WidgetConstants";
import { snipingModeSelector } from "selectors/editorSelectors";
import { useSelector } from "store";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { checkIsDropTarget } from "../PositionedContainer";
import { AppState } from "ce/reducers";
import { DRAG_MARGIN } from "widgets/constants";
import { getIsMobile } from "selectors/mainCanvasSelectors";

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
  zIndex: number;
  zIndexOnHover: number;
  isCurrentCanvasDragging: boolean;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex};

  width: ${({ componentWidth }) => `${Math.floor(componentWidth)}px`};
  height: ${({ componentHeight, isMobile }) =>
    isMobile ? "100%" : Math.floor(componentHeight) + "px"};
  min-width: ${({ minWidth }) => minWidth};
  min-height: 30px;

  flex-grow: ${({ isFillWidget }) => (isFillWidget ? "1" : "0")};

  &:hover {
    z-index: ${({ zIndexOnHover }) => zIndexOnHover} !important;
  }
  margin: ${({ isCurrentCanvasDragging }) =>
    isCurrentCanvasDragging ? `${DRAG_MARGIN * 2}px` : `${DRAG_MARGIN}px`};
`;

// TODO: update min width logic.

export function FlexComponent(props: AutoLayoutProps) {
  const isMobile = useSelector(getIsMobile);
  const isSnipingMode = useSelector(snipingModeSelector);
  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(() => {
    clickToSelectWidget(props.widgetId);
  }, [props.widgetId, clickToSelectWidget]);

  const { dragDetails } = useSelector(
    (state: AppState) => state.ui.widgetDragResize,
  );

  const isCurrentCanvasDragging = dragDetails?.draggedOn === props.parentId;

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
      componentWidth={
        isCurrentCanvasDragging
          ? props.componentWidth - DRAG_MARGIN * 2
          : props.componentWidth
      }
      id={props.widgetId}
      isCurrentCanvasDragging={isCurrentCanvasDragging}
      isFillWidget={isFillWidget}
      isMobile={isMobile}
      minWidth={minWidth}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      zIndex={zIndex}
      zIndexOnHover={onHoverZIndex}
    >
      {props.children}
    </FlexWidget>
  );
}

export default FlexComponent;
