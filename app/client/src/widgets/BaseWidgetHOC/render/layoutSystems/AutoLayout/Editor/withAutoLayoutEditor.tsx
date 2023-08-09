import React from "react";
import { useAutoLayoutEditor } from "./useAutoLayoutEditor";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutEditorWidgetOnion } from "./AutoLayoutEditorWidgetOnion";
import { AutoLayoutEditorCanvasOnion } from "./AutoLayoutEditorCanvasOnion";

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
    const detachFromLayoutWidget = props.detachFromLayout && !canvasWidget;
    //Canvas_Onion
    if (canvasWidget) {
      return <AutoLayoutEditorCanvasOnion {...widgetEditorProps} />;
    } else if (detachFromLayoutWidget) {
      //ToDo: (Ashok) bring modal editor layer here if possible
      // No Onion(Widgets like modal)
      return <Widget {...widgetEditorProps} />;
    }
    //Widget Onion
    return (
      <AutoLayoutEditorWidgetOnion {...widgetEditorProps}>
        <Widget {...widgetEditorProps} />
      </AutoLayoutEditorWidgetOnion>
    );
  }
  return WrappedWidget;
};
