import React, { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";
import { useClickOpenPropPane } from "utils/hooks/useClickOpenPropPane";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { Layers } from "constants/Layers";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getSelectedWidgets } from "selectors/ui";

const PositionedWidget = styled.div<{ isDragging: boolean }>`
  &:hover {
    z-index: ${(props) =>
      props.isDragging
        ? Layers.positionedWidget
        : Layers.positionedWidget + 1} !important;
  }
`;
type PositionedContainerProps = {
  style: BaseStyle;
  children: ReactNode;
  widgetId: string;
  widgetType: string;
  selected?: boolean;
  focused?: boolean;
  resizeDisabled?: boolean;
};

export function PositionedContainer(props: PositionedContainerProps) {
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.style.yPosition + (props.style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  const openPropertyPane = useClickOpenPropPane();
  // memoized classname
  const containerClassName = useMemo(() => {
    return (
      generateClassName(props.widgetId) +
      " positioned-widget " +
      `t--widget-${props.widgetType
        .split("_")
        .join("")
        .toLowerCase()}`
    );
  }, [props.widgetType, props.widgetId]);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const isThisWidgetDragging =
    isDragging && selectedWidgets.includes(props.widgetId);
  const containerStyle: CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      left: x,
      top: y,
      height: props.style.componentHeight + (props.style.heightUnit || "px"),
      width: props.style.componentWidth + (props.style.widthUnit || "px"),
      padding: padding + "px",
      zIndex:
        isDragging &&
        !isThisWidgetDragging &&
        [
          "CONTAINER_WIDGET",
          "FORM_WIDGET",
          "LIST_WIDGET",
          "TABS_WIDGET",
        ].includes(props.widgetType)
          ? 3
          : props.selected || props.focused
          ? Layers.selectedWidget
          : Layers.positionedWidget,
      backgroundColor: "inherit",
    };
  }, [props.style, isDragging]);

  const openPropPane = useCallback((e) => openPropertyPane(e, props.widgetId), [
    props.widgetId,
    openPropertyPane,
  ]);

  return (
    <PositionedWidget
      className={containerClassName}
      data-testid="test-widget"
      id={props.widgetId}
      key={`positioned-container-${props.widgetId}`}
      isDragging={isDragging}
      onClick={stopEventPropagation}
      // Positioned Widget is the top enclosure for all widgets and clicks on/inside the widget should not be propogated/bubbled out of this Container.
      onClickCapture={openPropPane}
      //Before you remove: This is used by property pane to reference the element
      style={containerStyle}
    >
      {props.children}
    </PositionedWidget>
  );
}

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
