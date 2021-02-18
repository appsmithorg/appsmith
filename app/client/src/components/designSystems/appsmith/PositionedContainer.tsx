import React, { ReactNode } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";

const PositionedWidget = styled.div<{
  resizeDisabled: boolean;
}>`
  &:hover {
    z-index: ${(props) => (!props.resizeDisabled ? "1" : "auto")};
  }
`;
type PositionedContainerProps = {
  style: BaseStyle;
  children: ReactNode;
  widgetId: string;
  widgetType: string;
  resizeDisabled: boolean;
};

export const PositionedContainer = (props: PositionedContainerProps) => {
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.style.yPosition + (props.style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  return (
    <PositionedWidget
      resizeDisabled={props.resizeDisabled}
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: props.style.componentHeight + (props.style.heightUnit || "px"),
        width: props.style.componentWidth + (props.style.widthUnit || "px"),
        padding: padding + "px",
      }}
      id={props.widgetId}
      //Before you remove: This is used by property pane to reference the element
      className={
        generateClassName(props.widgetId) +
        " positioned-widget " +
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
