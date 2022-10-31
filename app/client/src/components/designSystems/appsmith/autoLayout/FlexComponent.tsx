import React, { ReactNode, useCallback } from "react";
import styled from "styled-components";

import { LayoutDirection, ResponsiveBehavior } from "components/constants";
import {
  MAIN_CONTAINER_WIDGET_ID,
  WidgetType,
  widgetTypeClassname,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
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
  parentColumnSpace: number;
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
  dragMargin: number;
  isAffectedByDrag: boolean;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex};

  width: ${({ componentWidth }) => `${Math.floor(componentWidth)}px`};
  height: ${({ componentHeight, isMobile }) =>
    isMobile ? "100%" : Math.floor(componentHeight) + "px"};
  min-width: ${({ minWidth }) => minWidth};
  min-height: 30px;
  padding: ${({ padding }) => padding + "px"};

  flex-grow: ${({ isFillWidget }) => (isFillWidget ? "1" : "0")};

  &:hover {
    z-index: ${({ zIndexOnHover }) => zIndexOnHover} !important;
  }
  margin: ${({ dragMargin, isAffectedByDrag }) =>
    isAffectedByDrag ? `${DRAG_MARGIN}px ${dragMargin}px` : "0px"};
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
  const isDragging: boolean = dragDetails?.draggedOn !== undefined;
  const isCurrentCanvasDragging: boolean =
    dragDetails?.draggedOn === props.parentId;

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

  const dragMargin = Math.max(props.parentColumnSpace, DRAG_MARGIN);
  const isAffectedByDrag: boolean =
    isCurrentCanvasDragging ||
    (isDragging && props.parentId === MAIN_CONTAINER_WIDGET_ID);
  const resizedWidth: number = isAffectedByDrag
    ? props.componentWidth - props.parentColumnSpace
    : props.componentWidth;

  return (
    <FlexWidget
      className={className}
      componentHeight={props.componentHeight}
      componentWidth={resizedWidth}
      dragMargin={
        props.parentId === MAIN_CONTAINER_WIDGET_ID
          ? dragMargin / 2
          : dragMargin
      }
      id={props.widgetId}
      isAffectedByDrag={isAffectedByDrag}
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
