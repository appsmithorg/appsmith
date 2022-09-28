import React, { ReactNode, useCallback } from "react";
import styled from "styled-components";

import { LayoutDirection, ResponsiveBehavior } from "components/constants";
import { WidgetType, WIDGET_PADDING } from "constants/WidgetConstants";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { checkIsDropTarget } from "./PositionedContainer";
import { useSelector } from "store";
import { snipingModeSelector } from "selectors/editorSelectors";

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
  isFillWidget: boolean;
  minWidth?: number;
  padding: number;
  zIndex: number;
  zIndexOnHover: number;
}>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex};

  width: ${({ componentWidth, isFillWidget }) =>
    isFillWidget ? "auto" : `${Math.floor(componentWidth)}px`};
  height: ${({ componentHeight }) => Math.floor(componentHeight) + "px"};
  min-width: ${({ minWidth }) => minWidth + "px"};
  min-height: 30px;
  padding: ${({ padding }) => padding + "px"};

  flex-grow: ${({ isFillWidget }) => (isFillWidget ? "1" : "0")};

  &:hover {
    z-index: ${({ zIndexOnHover }) => zIndexOnHover} !important;
  }
`;

// TODO: update min width logic.

export function FlexComponent(props: AutoLayoutProps) {
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

  const isFillWidget: boolean =
    props.direction === LayoutDirection.Vertical &&
    props.responsiveBehavior === ResponsiveBehavior.Fill;
  const className = `auto-layout-parent-${props.parentId} auto-layout-child-${
    props.widgetId
  } t--widget-${props.widgetType
    .split("_")
    .join("")
    .toLowerCase()}`;

  return (
    <FlexWidget
      className={className}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      isFillWidget={isFillWidget}
      minWidth={props.minWidth}
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
