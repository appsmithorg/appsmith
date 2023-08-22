import React, { useMemo } from "react";
import { useFixedLayoutEditor } from "./useFixedLayoutEditor";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutEditorWidgetOnion } from "./FixedLayoutEditorWidgetOnion";
import { FixedLayoutEditorModalOnion } from "./FixedLayoutEditorModalOnion";

export const FixedLayoutEditorWrapper = (props: WidgetProps) => {
  const { getComponentDimensions } = useFixedLayoutEditor(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
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
