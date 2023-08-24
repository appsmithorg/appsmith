import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { FixedLayoutWigdetComponent } from "../common/FixedLayoutWidgetComponent";
import { PositionedComponentLayer } from "../PositionedComponentLayer";

export const FixedLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <ErrorBoundary>
      <PositionedComponentLayer {...props}>
        <FixedLayoutWigdetComponent {...props}>
          {props.children}
        </FixedLayoutWigdetComponent>
      </PositionedComponentLayer>
    </ErrorBoundary>
  );
};
