import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutViewerWidgetOnion } from "./FixedLayoutViewerWidgetOnion";
import { FixedLayoutViewerModalOnion } from "./FixedLayoutViewerModalOnion";
import { getFixedLayoutComponentDimensions } from "..";

export const FixedLayoutViewerWrapper = (props: WidgetProps) => {
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(props);
  const widgetViewerProps = {
    ...props,
    componentHeight,
    componentWidth,
  };
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? FixedLayoutViewerModalOnion
      : FixedLayoutViewerWidgetOnion;
  }, [props.type]);
  const canvasWidget = props.type === "CANVAS_WIDGET";
  //Canvas_Onion
  if (canvasWidget) {
    return props.children;
  }
  return <WidgetOnion {...widgetViewerProps}>{props.children}</WidgetOnion>;
};
