import React, { CSSProperties, ReactNode, useMemo } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import {
  CONTAINER_GRID_PADDING,
  CSSUnits,
  PositionTypes,
  WidgetType,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import WidgetFactory from "utils/WidgetFactory";
import { memoize } from "lodash";
import {
  getIsReflowEffectedSelector,
  getReflowSelector,
} from "selectors/widgetReflowSelectors";
import { POSITIONED_WIDGET } from "constants/componentClassNameConstants";
import equal from "fast-deep-equal";

const PositionedWidget = styled.div<{ zIndexOnHover: number }>`
  &:hover {
    z-index: ${(props) => props.zIndexOnHover} !important;
  }
`;
export type PositionedContainerProps = {
  componentWidth: number;
  componentHeight: number;
  children: ReactNode;
  parentId?: string;
  widgetId: string;
  widgetType: WidgetType;
  selected?: boolean;
  focused?: boolean;
  resizeDisabled?: boolean;
  topRow: number;
  parentRowSpace: number;
  noContainerOffset?: boolean;
  leftColumn: number;
  parentColumnSpace: number;
};

export const checkIsDropTarget = memoize(function isDropTarget(
  type: WidgetType,
) {
  return !!WidgetFactory.widgetConfigMap.get(type)?.isCanvas;
});

export function PositionedContainer(props: PositionedContainerProps) {
  const { componentHeight, componentWidth } = props;

  // Memoizing the style
  const style: BaseStyle = useMemo(
    () => ({
      positionType: PositionTypes.ABSOLUTE,
      componentHeight,
      componentWidth,
      yPosition:
        props.topRow * props.parentRowSpace +
        (props.noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
      xPosition:
        props.leftColumn * props.parentColumnSpace +
        (props.noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL,
    }),
    [
      componentWidth,
      componentHeight,
      props.topRow,
      props.parentRowSpace,
      props.parentColumnSpace,
      props.leftColumn,
      props.noContainerOffset,
    ],
  );
  // const style: BaseStyle = getStyle(componentWidth, componentHeight);
  const x = style.xPosition + (style.xPositionUnit || "px");
  const y = style.yPosition + (style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const isSnipingMode = useSelector(snipingModeSelector);
  // memoized className
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

  const reflowedPosition = useSelector(
    getReflowSelector(props.widgetId),
    equal,
  );

  const isReflowEffected = useSelector(
    getIsReflowEffectedSelector(props.parentId, Boolean(reflowedPosition)),
  );

  const containerStyle: CSSProperties = useMemo(() => {
    const reflowX = reflowedPosition?.X || 0;
    const reflowY = reflowedPosition?.Y || 0;
    const reflowWidth = reflowedPosition?.width;
    const reflowHeight = reflowedPosition?.height;
    const hasReflowedPosition =
      isReflowEffected && (reflowX !== 0 || reflowY !== 0);
    const hasReflowedDimensions =
      isReflowEffected &&
      ((reflowHeight && reflowHeight !== style.componentHeight) ||
        (reflowWidth && reflowWidth !== style.componentWidth));
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
      height:
        reflowHeight || style.componentHeight + (style.heightUnit || "px"),
      width: reflowWidth || style.componentWidth + (style.widthUnit || "px"),
      padding: padding + "px",
      zIndex,
      backgroundColor: "inherit",
      ...reflowedPositionStyles,
      ...reflowDimensionsStyles,
      ...dropTargetStyles,
    };
    return styles;
  }, [style, isReflowEffected, onHoverZIndex, zIndex, reflowedPosition]);

  // TODO: Experimental fix for sniping mode. This should be handled with a single event
  const stopEventPropagation = (e: any) => {
    !isSnipingMode && e.stopPropagation();
  };

  return (
    <PositionedWidget
      className={containerClassName}
      data-testid="test-widget"
      id={props.widgetId}
      key={`positioned-container-${props.widgetId}`}
      // Positioned Widget is the top enclosure for all widgets and clicks on/inside the widget should not be propagated/bubbled out of this Container.
      onClick={stopEventPropagation}
      onClickCapture={clickToSelectWidget}
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
