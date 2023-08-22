import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutViewerModalOnion } from "./AutoLayoutViewerModalOnion";
import { AutoLayoutViewerWidgetOnion } from "./AutoLayoutViewerWidgetOnion";
import { useAutoLayoutViewer } from "./useAutoLayoutViewer";

export const AutoLayoutViewerWrapper = (props: WidgetProps) => {
  const { autoDimensionConfig, getComponentDimensions } =
    useAutoLayoutViewer(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
  const widgetViewerProps = {
    ...props,
    componentHeight,
    componentWidth,
    autoDimensionConfig,
  };
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AutoLayoutViewerModalOnion
      : AutoLayoutViewerWidgetOnion;
  }, [props.type]);
  const canvasWidget = props.type === "CANVAS_WIDGET";
  //Canvas_Onion
  if (canvasWidget) {
    return props.children;
  }

  return <WidgetOnion {...widgetViewerProps}>{props.children}</WidgetOnion>;
};
