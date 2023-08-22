import React from "react";
import { useFixedLayoutViewer } from "./useFixedLayoutViewer";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutViewerWidgetOnion } from "./FixedLayoutViewerWidgetOnion";
import { FixedLayoutViewerModalOnion } from "./FixedLayoutViewerModalOnion";

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
    //Canvas_Onion
    if (canvasWidget) {
      return <Widget {...widgetViewerProps} />;
    }
    //Widget Onion
    const WidgetOnion =
      props.type === "MODAL_WIDGET"
        ? FixedLayoutViewerModalOnion
        : FixedLayoutViewerWidgetOnion;
    return (
      <WidgetOnion {...widgetViewerProps}>
        <Widget {...widgetViewerProps} />
      </WidgetOnion>
    );
  }
  return WrappedWidget;
};
