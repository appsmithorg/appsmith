import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutEditorWidgetOnion } from "./FixedLayoutEditorWidgetOnion";
import { FixedLayoutEditorModalOnion } from "./FixedLayoutEditorModalOnion";
import { getFixedLayoutComponentDimensions } from "../common/utils";

export const FixedLayoutEditorWrapper = (props: WidgetProps) => {
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(props);
  const widgetEditorProps = {
    ...props,
    componentHeight,
    componentWidth,
  };
  //Widget Onion
  const WidgetOnion = useMemo(() => {
    return props.type === "MODAL_WIDGET"
      ? FixedLayoutEditorModalOnion
      : FixedLayoutEditorWidgetOnion;
  }, [props.type]);
  const canvasWidget = props.type === "CANVAS_WIDGET";
  //Canvas_Onion
  if (canvasWidget) {
    return props.children;
  }

  return <WidgetOnion {...widgetEditorProps}>{props.children}</WidgetOnion>;
};
