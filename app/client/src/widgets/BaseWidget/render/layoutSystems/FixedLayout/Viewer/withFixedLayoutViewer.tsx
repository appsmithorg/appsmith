import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { useBaseWidgetUtilities } from "widgets/BaseWidget/utilities/useBaseWidgetUtilities";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import { PositionedComponentLayer } from "widgets/BaseWidget/render/layoutSystems/FixedLayout/PositionedComponentLayer";
import { WidgetComponent } from "widgets/BaseWidget/render/common/WidgetComponent";
import { useFixedLayoutViewer } from "./useFixedLayoutViewer";

export const withFixedLayoutViewer = (
  Widget: (widgetData: any) => JSX.Element,
  props: BaseWidgetProps,
) => {
  const baseWidgetUtilities = useBaseWidgetUtilities(props);
  const { getComponentDimensions } = useFixedLayoutViewer(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
  const widgetViewerProps = {
    ...props,
    ...baseWidgetUtilities,
    componentHeight,
    componentWidth,
  };
  return (
    <PositionedComponentLayer {...widgetViewerProps}>
      <ErrorBoundary>
        <WidgetComponent {...widgetViewerProps}>
          <Widget {...widgetViewerProps} />
        </WidgetComponent>
      </ErrorBoundary>
    </PositionedComponentLayer>
  );
};
