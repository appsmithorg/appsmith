import React, { useMemo } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutEditorWidgetOnion } from "./FixedLayoutEditorWidgetOnion";
import { FixedLayoutEditorModalOnion } from "./FixedLayoutEditorModalOnion";

export const FixedLayoutEditorWrapper = (props: WidgetProps) => {
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

  return <WidgetOnion {...props}>{props.children}</WidgetOnion>;
};
