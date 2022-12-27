import React, { CSSProperties, ReactNode, useCallback, useMemo } from "react";
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
import { isWidgetSelected } from "selectors/widgetSelectors";
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
  parentColumnSpace: number;
  flexVerticalAlignment: FlexVerticalAlignment;
};

const FlexWidget = styled.div`
  position: relative;
`;

export function FlexComponent(props: AutoLayoutProps) {
  const isMobile = useSelector(getIsMobile);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
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

  const flexComponentStyle: CSSProperties = useMemo(() => {
    return {
      display: isSelected && isDragging ? "none" : "block",
      zIndex,
      width: `${Math.floor(props.componentWidth)}px`,
      height: isMobile ? "auto" : Math.floor(props.componentHeight) + "px",
      minHeight: "30px",
      padding: WIDGET_PADDING + "px",
      flexGrow: isFillWidget ? 1 : 0,
      alignSelf: props.flexVerticalAlignment,
      "&:hover": {
        zIndex: onHoverZIndex + " !important",
      },
    };
  }, [
    isDragging,
    isFillWidget,
    isMobile,
    isSelected,
    props.componentWidth,
    props.componentHeight,
    props.flexVerticalAlignment,
    zIndex,
    onHoverZIndex,
  ]);

  return (
    <FlexWidget
      className={className}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      style={flexComponentStyle}
    >
      {props.children}
    </FlexWidget>
  );
}

export default FlexComponent;
