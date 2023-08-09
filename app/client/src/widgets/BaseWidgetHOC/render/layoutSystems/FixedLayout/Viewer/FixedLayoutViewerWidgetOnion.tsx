import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoHeightLayer } from "../AutoHeightLayer";
import { PositionedComponentLayer } from "../PositionedComponentLayer";

export const FixedLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AutoHeightLayer {...props}>
      <PositionedComponentLayer {...props}>
        <ErrorBoundary>
          <WidgetComponent {...props}>{props.children}</WidgetComponent>
        </ErrorBoundary>
      </PositionedComponentLayer>
    </AutoHeightLayer>
  );
};
