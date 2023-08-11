import React from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { AutoLayoutViewerCanvasOnion } from "./AutoLayoutViewerCanvasOnion";
import { AutoLayoutViewerModalOnion } from "./AutoLayoutViewerModalOnion";
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
    //Canvas_Onion
    if (canvasWidget) {
      return <AutoLayoutViewerCanvasOnion {...widgetViewerProps} />;
    }
    //Widget Onion
    const WidgetOnion =
      props.type === "MODAL_WIDGET"
        ? AutoLayoutViewerModalOnion
        : AutoLayoutViewerWidgetOnion;
    return (
      <WidgetOnion {...widgetViewerProps}>
        <Widget {...widgetViewerProps} />
      </WidgetOnion>
    );
  }
  return WrappedWidget;
};
