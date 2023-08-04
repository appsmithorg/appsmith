import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import { FlexComponentLayer } from "../FlexComponentLayer";
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
    if (props.type === "CANVAS_WIDGET") {
      return <Widget {...widgetViewerProps} />;
    }
    return (
      <FlexComponentLayer {...widgetViewerProps}>
        <ErrorBoundary>
          <WidgetComponent {...widgetViewerProps}>
            <Widget {...widgetViewerProps} />
          </WidgetComponent>
        </ErrorBoundary>
      </FlexComponentLayer>
    );
  }
  return WrappedWidget;
};
