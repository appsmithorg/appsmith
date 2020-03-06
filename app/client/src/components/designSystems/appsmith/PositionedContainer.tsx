import React from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { theme } from "constants/DefaultTheme";
type PositionedContainerProps = {
  style: BaseStyle;
  children: JSX.Element | JSX.Element[];
  isMainContainer?: boolean;
};

export const PositionedContainer = (props: PositionedContainerProps) => {
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.isMainContainer
    ? theme.spaces[9]
    : props.style.yPosition + (props.style.yPositionUnit || "px");
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: props.style.componentHeight + (props.style.heightUnit || "px"),
        width: props.style.componentWidth + (props.style.widthUnit || "px"),
        padding: props.isMainContainer ? 0 : WIDGET_PADDING + "px",
      }}
    >
      {props.children}
    </div>
  );
};

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
