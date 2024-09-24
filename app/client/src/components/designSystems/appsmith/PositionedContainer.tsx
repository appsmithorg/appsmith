import type { CSSProperties, ReactNode, Ref } from "react";
import React, { useMemo } from "react";
import type { BaseStyle } from "widgets/BaseWidget";
import type { WidgetType } from "constants/WidgetConstants";
import {
  CONTAINER_GRID_PADDING,
  CSSUnits,
  PositionTypes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { useSelector } from "react-redux";
import {
  getIsReflowEffectedSelector,
  getReflowSelector,
} from "selectors/widgetReflowSelectors";
import { POSITIONED_WIDGET } from "constants/componentClassNameConstants";
import equal from "fast-deep-equal";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import { useHoverToFocusWidget } from "utils/hooks/useHoverToFocusWidget";

const PositionedWidget = styled.div<{
  zIndexOnHover: number;
  disabled?: boolean;
}>`
  &:hover {
    z-index: ${(props) => props.zIndexOnHover} !important;
  }
`;

export interface PositionedContainerProps {
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
  isDisabled?: boolean;
  isVisible?: boolean;
  widgetName: string;
}

export function PositionedContainer(
  props: PositionedContainerProps,
  ref: Ref<HTMLDivElement>,
) {
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
  // memoized className
  const containerClassName = useMemo(() => {
    return (
      generateClassName(props.widgetId) +
      ` ${POSITIONED_WIDGET} ${widgetTypeClassname(
        props.widgetType,
      )} t--widget-${props.widgetName?.toLowerCase()}`
    );
  }, [props.widgetType, props.widgetId, props.widgetName]);
  const isDropTarget = checkIsDropTarget(props.widgetType);

  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    props.focused,
    props.selected,
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
          transform: `translate3d(${reflowX}px,${reflowY}px,0)`,
          boxShadow: `0 0 0 1px rgba(104,113,239,0.5)`,
        }
      : {};
    const reflowDimensionsStyles = hasReflowedDimensions
      ? {
          boxShadow: `0 0 0 1px rgba(104,113,239,0.5)`,
        }
      : {};

    const styles: CSSProperties = {
      position: "absolute",
      left: x,
      top: y,
      transition: `transform 100ms ease, width 100ms ease, height 100ms ease`,
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

  const [handleMouseOver, handleMouseLeave] = useHoverToFocusWidget(
    props.widgetId,
    props.resizeDisabled,
  );

  // TODO: Experimental fix for sniping mode. This should be handled with a single event
  return (
    <PositionedWidget
      className={containerClassName}
      data-hidden={!props.isVisible || undefined}
      data-testid="test-widget"
      data-widgetname-cy={props.widgetName}
      disabled={props.isDisabled}
      id={props.widgetId}
      key={`positioned-container-${props.widgetId}`}
      onClickCapture={clickToSelectWidget}
      onMouseLeave={handleMouseLeave}
      onMouseOver={handleMouseOver}
      ref={ref}
      //Before you remove: This is used by property pane to reference the element
      style={containerStyle}
      zIndexOnHover={onHoverZIndex}
    >
      {props.children}
    </PositionedWidget>
  );
}

export default React.forwardRef(PositionedContainer);
