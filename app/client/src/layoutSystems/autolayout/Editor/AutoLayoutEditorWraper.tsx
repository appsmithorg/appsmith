import React, { useMemo } from "react";
import {
  getAutoLayoutComponentDimensions,
  getAutoLayoutDimensionsConfig,
} from "../common/utils";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutEditorWidgetOnion } from "./AutoLayoutEditorWidgetOnion";
import { AutoLayoutEditorModalOnion } from "./AutoLayoutEditorModalOnion";

export const AutoLayoutEditorWraper = (props: WidgetProps) => {
  const autoDimensionConfig = getAutoLayoutDimensionsConfig(props);
  const { componentHeight, componentWidth } =
    getAutoLayoutComponentDimensions(props);
  const widgetEditorProps = {
    ...props,
    componentHeight,
    componentWidth,
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
