import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutViewerModalOnion } from "./AutoLayoutViewerModalOnion";
import { AutoLayoutViewerWidgetOnion } from "./AutoLayoutViewerWidgetOnion";

export const AutoLayoutViewerWrapper = (props: WidgetProps) => {
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

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
