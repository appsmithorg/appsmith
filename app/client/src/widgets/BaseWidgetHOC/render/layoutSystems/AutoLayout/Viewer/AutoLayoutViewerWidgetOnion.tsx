import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { FlexComponentLayer } from "../common/FlexComponentLayer";

export const AutoLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <FlexComponentLayer {...props}>
      <ErrorBoundary>
        <WidgetComponent {...props}>{props.children}</WidgetComponent>
      </ErrorBoundary>
    </FlexComponentLayer>
  );
};
