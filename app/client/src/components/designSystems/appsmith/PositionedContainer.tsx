import React, { ReactNode, useMemo } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled, { CSSProperties } from "styled-components";
import { useClickOpenPropPane } from "utils/hooks/useClickOpenPropPane";

const PositionedWidget = styled.div`
  &:hover {
    z-index: 1;
  }
`;
type PositionedContainerProps = {
  style: BaseStyle;
  children: ReactNode;
  widgetId: string;
  widgetType: string;
};

export const PositionedContainer = (props: PositionedContainerProps) => {
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.style.yPosition + (props.style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  const openPropertyPane = useClickOpenPropPane(props.widgetId);
  const styles: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: x,
      top: y,
      height: props.style.componentHeight + (props.style.heightUnit || "px"),
      width: props.style.componentWidth + (props.style.widthUnit || "px"),
      padding: padding + "px",
    }),
    [props.style.componentHeight, props.style.componentWidth],
  );

  return (
    <PositionedWidget
      onClickCapture={openPropertyPane}
      style={styles}
      id={props.widgetId}
      //Before you remove: This is used by property pane to reference the element
      className={
        generateClassName(props.widgetId) +
        " " +
        `t--widget-${props.widgetType
          .split("_")
          .join("")
          .toLowerCase()}`
      }
    >
      {props.children}
    </PositionedWidget>
  );
};

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
