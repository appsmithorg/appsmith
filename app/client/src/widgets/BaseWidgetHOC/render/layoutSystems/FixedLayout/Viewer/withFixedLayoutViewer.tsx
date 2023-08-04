import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { useFixedLayoutViewer } from "./useFixedLayoutViewer";
import type { WidgetProps } from "widgets/BaseWidget";
import { PositionedComponentLayer } from "../PositionedComponentLayer";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";

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
    if (props.type === "CANVAS_WIDGET") {
      return <Widget {...widgetViewerProps} />;
    }
    return (
      <PositionedComponentLayer {...widgetViewerProps}>
        <ErrorBoundary>
          <WidgetComponent {...widgetViewerProps}>
            <Widget {...widgetViewerProps} />
          </WidgetComponent>
        </ErrorBoundary>
      </PositionedComponentLayer>
    );
  }
  return WrappedWidget;
};
