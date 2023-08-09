import React from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutViewerCanvasOnion } from "./AutoLayoutViewerCanvasOnion";
import { AutoLayoutViewerWidgetOnion } from "./AutoLayoutViewerWidgetOnion";
import { useAutoLayoutViewer } from "./useAutoLayoutViewer";

export const withAutoLayoutViewer = (
  Widget: (widgetData: any) => JSX.Element | null,
) => {
  function WrappedWidget(props: WidgetProps) {
    const { autoDimensionConfig, getComponentDimensions } =
      useAutoLayoutViewer(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetViewerProps = {
      ...props,
      componentHeight,
      componentWidth,
      autoDimensionConfig,
    };
    const canvasWidget = props.type === "CANVAS_WIDGET";
    const detachFromLayoutWidget = props.detachFromLayout && !canvasWidget;
    //Canvas_Onion
    if (canvasWidget) {
      return <AutoLayoutViewerCanvasOnion {...widgetViewerProps} />;
    } else if (detachFromLayoutWidget) {
      //ToDo: (Ashok) bring modal editor layer here if possible
      // No Onion(Widgets like modal)
      return <Widget {...widgetViewerProps} />;
    }
    //Widget Onion
    return (
      <AutoLayoutViewerWidgetOnion {...widgetViewerProps}>
        <Widget {...widgetViewerProps} />
      </AutoLayoutViewerWidgetOnion>
    );
  }
  return WrappedWidget;
};
