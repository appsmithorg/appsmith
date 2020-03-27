import React, { ReactNode } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
type PositionedContainerProps = {
  style: BaseStyle;
  children: ReactNode;
  widgetId: string;
};

export const PositionedContainer = (props: PositionedContainerProps) => {
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.style.yPosition + (props.style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: props.style.componentHeight + (props.style.heightUnit || "px"),
        width: props.style.componentWidth + (props.style.widthUnit || "px"),
        padding: padding + "px",
      }}
      //Before you remove: This is used by property pane to reference the element
      className={generateClassName(props.widgetId)}
    >
      {props.children}
    </div>
  );
};

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
