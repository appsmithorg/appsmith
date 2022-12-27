import React, { ReactNode, useCallback } from "react";
import styled from "styled-components";

import {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "components/constants";
import {
  WidgetType,
  widgetTypeClassname,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { checkIsDropTarget } from "../PositionedContainer";

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
  parentId?: string;
  flexVerticalAlignment: FlexVerticalAlignment;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex};

  width: ${({ componentWidth }) => `${Math.floor(componentWidth)}px`};
  height: ${({ componentHeight, isMobile }) =>
    isMobile ? "auto" : Math.floor(componentHeight) + "px"};

  min-height: 30px;
  padding: ${({ padding }) => padding + "px"};

  flex-grow: ${({ isFillWidget }) => (isFillWidget ? "1" : "0")};
  align-self: ${({ flexVerticalAlignment }) => flexVerticalAlignment};

  &:hover {
    z-index: ${({ zIndexOnHover }) => zIndexOnHover} !important;
  }
`;

export function FlexComponent(props: AutoLayoutProps) {
  const isMobile = useSelector(getIsMobile);
  const isSnipingMode = useSelector(snipingModeSelector);
  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(() => {
    clickToSelectWidget(props.widgetId);
  }, [props.widgetId, clickToSelectWidget]);

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

  return (
    <FlexWidget
      className={className}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      flexVerticalAlignment={props.flexVerticalAlignment}
      id={props.widgetId}
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
