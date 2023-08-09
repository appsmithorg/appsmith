import React from "react";
import { useFixedLayoutViewer } from "./useFixedLayoutViewer";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutViewerCanvasOnion } from "./FixedLayoutViewerCanvasOnion";
import { FixedLayoutViewerWidgetOnion } from "./FixedLayoutViewerWidgetOnion";

export const withFixedLayoutViewer = (
  Widget: (widgetData: any) => JSX.Element | null,
) => {
  function WrappedWidget(props: WidgetProps) {
    const { getComponentDimensions } = useFixedLayoutViewer(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetViewerProps = {
      ...props,
      componentHeight,
      componentWidth,
    };
    const canvasWidget = props.type === "CANVAS_WIDGET";
    const detachFromLayoutWidget = props.detachFromLayout && !canvasWidget;
    //Canvas_Onion
    if (canvasWidget) {
      return <FixedLayoutViewerCanvasOnion {...widgetViewerProps} />;
    } else if (detachFromLayoutWidget) {
      //ToDo: (Ashok) bring modal editor layer here if possible
      // No Onion(Widgets like modal)
      return <Widget {...widgetViewerProps} />;
    }
    return (
      <FixedLayoutViewerWidgetOnion {...widgetViewerProps}>
        <Widget {...widgetViewerProps} />
      </FixedLayoutViewerWidgetOnion>
    );
  }
  return WrappedWidget;
};
