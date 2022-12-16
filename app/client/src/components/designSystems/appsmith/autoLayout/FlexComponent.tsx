import React, { ReactNode, useCallback } from "react";
import styled from "styled-components";

import {
  LayoutDirection,
  ResponsiveBehavior,
  FlexVerticalAlignment,
} from "components/constants";
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
import { getSiblingCount } from "selectors/autoLayoutSelectors";

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
  flexVerticalAlignment: FlexVerticalAlignment;
};
// TODO: create a memoized style object for the div instead.
const FlexWidget = styled.div<{
  componentHeight: number;
  componentWidth: number;
  isMobile: boolean;
  isFillWidget: boolean;
  padding: number;
  zIndex: number;
  zIndexOnHover: number;
  dragMargin: number;
  isAffectedByDrag: boolean;
  parentId?: string;
  flexVerticalAlignment: FlexVerticalAlignment;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex};

  width: ${({ componentWidth }) => `${Math.floor(componentWidth)}px`};
  height: ${({ componentHeight, isMobile }) =>
    isMobile ? "auto" : Math.floor(componentHeight) + "px"};

  min-height: 30px;
  padding: ${({ isAffectedByDrag, padding }) =>
    isAffectedByDrag ? 0 : padding + "px"};

  flex-grow: ${({ isFillWidget }) => (isFillWidget ? "1" : "0")};
  align-self: ${({ flexVerticalAlignment }) => flexVerticalAlignment};

  &:hover {
    z-index: ${({ zIndexOnHover }) => zIndexOnHover} !important;
  }
  margin-top: ${({ isAffectedByDrag }) => (isAffectedByDrag ? "4px" : "0px")};
`;

const DEFAULT_MARGIN = 16;

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

  const siblingCount = useSelector(
    getSiblingCount(props.widgetId, props.parentId || MAIN_CONTAINER_WIDGET_ID),
  );

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

  const dragMargin =
    props.parentId === MAIN_CONTAINER_WIDGET_ID
      ? DEFAULT_MARGIN
      : Math.max(props.parentColumnSpace, DRAG_MARGIN);

  const isAffectedByDrag: boolean = isDragging;
  // TODO: Simplify this logic.
  /**
   * resize logic:
   * if isAffectedByDrag
   * newWidth = width - drag margin -
   * (decrease in parent width) / # of siblings -
   * width of the DropPosition introduced due to the widget.
   */
  const resizedWidth: number = isAffectedByDrag
    ? props.componentWidth -
      dragMargin -
      (siblingCount > 0
        ? (DEFAULT_MARGIN * siblingCount + 2) / siblingCount
        : 0)
    : props.componentWidth;

  return (
    <FlexWidget
      className={className}
      componentHeight={props.componentHeight}
      componentWidth={resizedWidth}
      dragMargin={dragMargin}
      flexVerticalAlignment={props.flexVerticalAlignment}
      id={props.widgetId}
      isAffectedByDrag={isAffectedByDrag}
      isFillWidget={isFillWidget}
      isMobile={isMobile}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      padding={WIDGET_PADDING}
      parentId={props.parentId}
      zIndex={zIndex}
      zIndexOnHover={onHoverZIndex}
    >
      {props.children}
    </FlexWidget>
  );
}

export default FlexComponent;
