import React, { useMemo } from "react";
import { useAutoLayoutEditor } from "./useAutoLayoutEditor";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutEditorWidgetOnion } from "./AutoLayoutEditorWidgetOnion";
import { AutoLayoutEditorModalOnion } from "./AutoLayoutEditorModalOnion";

export const AutoLayoutEditorWraper = (props: WidgetProps) => {
  const { autoDimensionConfig, getComponentDimensions } =
    useAutoLayoutEditor(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
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
