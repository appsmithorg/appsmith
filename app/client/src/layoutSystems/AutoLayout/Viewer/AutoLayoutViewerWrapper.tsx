import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAutoLayoutSystemProps } from "../AutoLayoutSystemWrapper";
import { AutoLayoutViewerModalOnion } from "./AutoLayoutViewerModalOnion";
import { AutoLayoutViewerWidgetOnion } from "./AutoLayoutViewerWidgetOnion";

export const AutoLayoutViewerWrapper = (props: WidgetProps) => {
  const { autoDimensionConfig, componentDimensions } =
    getAutoLayoutSystemProps(props);
  const widgetViewerProps = {
    ...props,
    ...componentDimensions,
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
