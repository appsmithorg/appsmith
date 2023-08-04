import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { useBaseWidgetUtilities } from "widgets/BaseWidget/utilities/useBaseWidgetUtilities";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import { FlexComponentLayer } from "widgets/BaseWidget/render/layoutSystems/AutoLayout/FlexComponentLayer";
import { WidgetComponent } from "widgets/BaseWidget/render/common/WidgetComponent";
import { useAutoLayoutViewer } from "./useAutoLayoutViewer";

export const withAutoLayoutViewer = (
  Widget: (widgetData: any) => JSX.Element,
  props: BaseWidgetProps,
) => {
  const baseWidgetUtilities = useBaseWidgetUtilities(props);
  const { autoDimensionConfig, getComponentDimensions } =
    useAutoLayoutViewer(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
  const widgetViewerProps = {
    ...props,
    ...baseWidgetUtilities,
    componentHeight,
    componentWidth,
    autoDimensionConfig,
  };
  return (
    <FlexComponentLayer {...widgetViewerProps}>
      <ErrorBoundary>
        <WidgetComponent {...widgetViewerProps}>
          <Widget {...widgetViewerProps} />
        </WidgetComponent>
      </ErrorBoundary>
    </FlexComponentLayer>
  );
};
