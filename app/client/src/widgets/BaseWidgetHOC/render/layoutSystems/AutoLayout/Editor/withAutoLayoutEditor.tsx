import React, { memo } from "react";
import { useAutoLayoutEditor } from "./useAutoLayoutEditor";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutEditorWidgetOnion } from "./AutoLayoutEditorWidgetOnion";
import { AutoLayoutEditorCanvasOnion } from "./AutoLayoutEditorCanvasOnion";
import { AutoLayoutEditorModalOnion } from "./AutoLayoutEditorModalOnion";

export const withAutoLayoutEditor = (
  Widget: (widgetData: any) => JSX.Element | null,
) => {
  function WrappedWidget(props: WidgetProps) {
    const { autoDimensionConfig, getComponentDimensions } =
      useAutoLayoutEditor(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetEditorProps = {
      ...props,
      componentHeight,
      componentWidth,
      autoDimensionConfig,
    };
    const canvasWidget = props.type === "CANVAS_WIDGET";
    //Canvas_Onion
    if (canvasWidget) {
      return <AutoLayoutEditorCanvasOnion {...widgetEditorProps} />;
    }
    //Widget Onion
    const WidgetOnion =
      props.type === "MODAL_WIDGET"
        ? AutoLayoutEditorModalOnion
        : AutoLayoutEditorWidgetOnion;
    return (
      <WidgetOnion {...widgetEditorProps}>
        <Widget {...widgetEditorProps} />
      </WidgetOnion>
    );
  }
  return memo(WrappedWidget);
};
