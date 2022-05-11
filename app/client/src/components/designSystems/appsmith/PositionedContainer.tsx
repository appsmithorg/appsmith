import React, { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import { WidgetType, WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import WidgetFactory from "utils/WidgetFactory";
import { isEqual, memoize } from "lodash";
import { getReflowSelector } from "selectors/widgetReflowSelectors";
import { AppState } from "reducers";
import { POSITIONED_WIDGET } from "constants/componentClassNameConstants";

const PositionedWidget = styled.div<{ zIndexOnHover: number }>`
  &:hover {
    z-index: ${(props) => props.zIndexOnHover} !important;
  }
`;
export type PositionedContainerProps = {
  componentHeight: number;
  componentWidth: number;
  children: ReactNode;
  parentId?: string;
  widgetId: string;
  widgetType: WidgetType;
  selected?: boolean;
  focused?: boolean;
  resizeDisabled?: boolean;
  xPosition: number;
  yPosition: number;
};

export const checkIsDropTarget = memoize(function isDropTarget(
  type: WidgetType,
) {
  return !!WidgetFactory.widgetConfigMap.get(type)?.isCanvas;
});

export function PositionedContainer(props: PositionedContainerProps) {
  const x = props.xPosition + "px";
  const y = props.yPosition + "px";
  const padding = WIDGET_PADDING;
  const clickToSelectWidget = useClickToSelectWidget();
  const isSnipingMode = useSelector(snipingModeSelector);
  // memoized classname
  const containerClassName = useMemo(() => {
    return (
      generateClassName(props.widgetId) +
      ` ${POSITIONED_WIDGET} t--widget-${props.widgetType
        .split("_")
        .join("")
        .toLowerCase()}`
    );
  }, [props.widgetType, props.widgetId]);
  const isDropTarget = checkIsDropTarget(props.widgetType);
  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(
    props,
    isDropTarget,
  );

  const reflowSelector = getReflowSelector(props.widgetId);

  const reflowedPosition = useSelector(reflowSelector, isEqual);
  const dragDetails = useSelector(
    (state: AppState) => state.ui.widgetDragResize.dragDetails,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isCurrentCanvasReflowing =
    (dragDetails && dragDetails.draggedOn === props.parentId) || isResizing;
  const containerStyle: CSSProperties = useMemo(() => {
    const reflowX = reflowedPosition?.X || 0;
    const reflowY = reflowedPosition?.Y || 0;
    const reflowWidth = reflowedPosition?.width;
    const reflowHeight = reflowedPosition?.height;
    const reflowEffected = isCurrentCanvasReflowing && reflowedPosition;
    const hasReflowedPosition =
      reflowEffected && (reflowX !== 0 || reflowY !== 0);
    const hasReflowedDimensions =
      reflowEffected &&
      ((reflowHeight && reflowHeight !== props.componentHeight) ||
        (reflowWidth && reflowWidth !== props.componentWidth));
    const effectedByReflow = hasReflowedPosition || hasReflowedDimensions;
    const dropTargetStyles: CSSProperties =
      isDropTarget && effectedByReflow ? { pointerEvents: "none" } : {};
    const reflowedPositionStyles: CSSProperties = hasReflowedPosition
      ? {
          transform: `translate(${reflowX}px,${reflowY}px)`,
          transition: `transform 100ms linear`,
          boxShadow: `0 0 0 1px rgba(104,113,239,0.5)`,
        }
      : {};
    const reflowDimensionsStyles = hasReflowedDimensions
      ? {
          transition: `width 0.1s, height 0.1s`,
          boxShadow: `0 0 0 1px rgba(104,113,239,0.5)`,
        }
      : {};
    const styles: CSSProperties = {
      position: "absolute",
      left: x,
      top: y,
      height: reflowHeight || props.componentHeight + "px",
      width: reflowWidth || props.componentWidth + "px",
      padding: padding + "px",
      zIndex,
      backgroundColor: "inherit",
      ...reflowedPositionStyles,
      ...reflowDimensionsStyles,
      ...dropTargetStyles,
    };
    return styles;
  }, [
    props.componentWidth,
    props.componentHeight,
    isCurrentCanvasReflowing,
    onHoverZIndex,
    zIndex,
    reflowSelector,
    reflowedPosition,
  ]);

  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e, props.widgetId);
    },
    [props.widgetId, clickToSelectWidget],
  );

  // TODO: Experimental fix for sniping mode. This should be handled with a single event
  const stopEventPropagation = useCallback(
    (e: any) => {
      !isSnipingMode && e.stopPropagation();
    },
    [isSnipingMode],
  );

  return (
    <PositionedWidget
      className={containerClassName}
      data-testid="test-widget"
      id={props.widgetId}
      key={`positioned-container-${props.widgetId}`}
      // Positioned Widget is the top enclosure for all widgets and clicks on/inside the widget should not be propogated/bubbled out of this Container.
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      //Before you remove: This is used by property pane to reference the element
      style={containerStyle}
      zIndexOnHover={onHoverZIndex}
    >
      {props.children}
    </PositionedWidget>
  );
}

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
