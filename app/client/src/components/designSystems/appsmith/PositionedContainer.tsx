import React from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { PositionTypes, WIDGET_PADDING } from "constants/WidgetConstants";
import { theme } from "constants/DefaultTheme";
type PositionedContainerProps = {
  style: BaseStyle;
  children: JSX.Element | JSX.Element[];
  isMainContainer?: boolean;
};

export const PositionedContainer = (props: PositionedContainerProps) => {
  return (
    <div
      style={{
        position:
          props.style.positionType === PositionTypes.ABSOLUTE
            ? "absolute"
            : "relative",
        height: props.style.componentHeight + (props.style.heightUnit || "px"),
        width: props.style.componentWidth + (props.style.widthUnit || "px"),
        left: props.style.xPosition + (props.style.xPositionUnit || "px"),
        top: props.isMainContainer
          ? theme.spaces[9]
          : props.style.yPosition + (props.style.yPositionUnit || "px"),
        padding: props.isMainContainer ? 0 : WIDGET_PADDING + "px",
        background: "white",
      }}
    >
      {props.children}
    </div>
  );
};

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
