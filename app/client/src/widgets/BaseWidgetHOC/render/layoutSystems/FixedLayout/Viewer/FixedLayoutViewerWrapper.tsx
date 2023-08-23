import React from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutViewerWidgetOnion } from "./FixedLayoutViewerWidgetOnion";
import { FixedLayoutViewerModalOnion } from "./FixedLayoutViewerModalOnion";
import { getFixedLayoutComponentDimensions } from "../common/utils";

export const FixedLayoutViewerWrapper = (props: WidgetProps) => {
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(props);
  const widgetViewerProps = {
    ...props,
    componentHeight,
    componentWidth,
  };
  const canvasWidget = props.type === "CANVAS_WIDGET";
  //Canvas_Onion
  if (canvasWidget) {
    return props.children;
  }
  //Widget Onion
  const WidgetOnion =
    props.type === "MODAL_WIDGET"
      ? FixedLayoutViewerModalOnion
      : FixedLayoutViewerWidgetOnion;
  return <WidgetOnion {...widgetViewerProps}>{props.childre}</WidgetOnion>;
};
