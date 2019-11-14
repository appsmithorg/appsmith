import React from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { PositionTypes } from "constants/WidgetConstants";
import { theme } from "constants/DefaultTheme";

type PositionedContainerProps = {
  style: BaseStyle;
  children: JSX.Element | JSX.Element[];
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
        top: props.style.yPosition + (props.style.yPositionUnit || "px"),
        padding: PositionedContainer.padding + "px",
      }}
    >
      {props.children}
    </div>
  );
};

PositionedContainer.padding = theme.spaces[2];

export default PositionedContainer;
