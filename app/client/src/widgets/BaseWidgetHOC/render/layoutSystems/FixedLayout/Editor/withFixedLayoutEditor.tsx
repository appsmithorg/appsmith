import React from "react";
import { useFixedLayoutEditor } from "./useFixedLayoutEditor";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutEditorWidgetOnion } from "./FixedLayoutEditorWidgetOnion";
import { FixedLayoutEditorCanvasOnion } from "./FixedLayoutEditorCanvasOnion";

export const withFixedLayoutEditor = (
  Widget: (widgetData: any) => JSX.Element | null,
) => {
  function WrappedWidget(props: WidgetProps) {
    const { getComponentDimensions } = useFixedLayoutEditor(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetEditorProps = {
      ...props,
      componentHeight,
      componentWidth,
    };
    const canvasWidget = props.type === "CANVAS_WIDGET";
    const detachFromLayoutWidget = props.detachFromLayout && !canvasWidget;
    //Canvas_Onion
    if (canvasWidget) {
      return <FixedLayoutEditorCanvasOnion {...widgetEditorProps} />;
    } else if (detachFromLayoutWidget) {
      //ToDo: (Ashok) bring modal editor layer here if possible
      // No Onion(Widgets like modal)
      return <Widget {...widgetEditorProps} />;
    }
    return (
      <FixedLayoutEditorWidgetOnion {...widgetEditorProps}>
        <Widget {...widgetEditorProps} />
      </FixedLayoutEditorWidgetOnion>
    );
  }
  return WrappedWidget;
};
