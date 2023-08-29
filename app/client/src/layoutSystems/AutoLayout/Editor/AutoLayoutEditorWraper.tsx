import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutEditorWidgetOnion } from "./AutoLayoutEditorWidgetOnion";
import { AutoLayoutEditorModalOnion } from "./AutoLayoutEditorModalOnion";
import { getAutoLayoutSystemProps } from "../AutoLayoutSystemWrapper";

export const AutoLayoutEditorWraper = (props: WidgetProps) => {
  const { autoDimensionConfig, componentDimensions } =
    getAutoLayoutSystemProps(props);
  const widgetEditorProps = {
    ...props,
    ...componentDimensions,
    autoDimensionConfig,
  };
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? AutoLayoutEditorModalOnion
      : AutoLayoutEditorWidgetOnion;
  }, [props.type]);
  const canvasWidget = props.type === "CANVAS_WIDGET";
  //Canvas_Onion
  if (canvasWidget) {
    return props.children;
  }

  return <WidgetOnion {...widgetEditorProps}>{props.children}</WidgetOnion>;
};
