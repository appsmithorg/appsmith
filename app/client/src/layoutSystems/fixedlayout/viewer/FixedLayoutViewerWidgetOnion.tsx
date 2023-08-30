import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { FixedLayoutWigdetComponent } from "../common/widgetComponent/FixedLayoutWidgetComponent";
import { PositionedComponentLayer } from "../common/PositionedComponentLayer";

export const FixedLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <PositionedComponentLayer {...props}>
      <FixedLayoutWigdetComponent {...props}>
        {props.children}
      </FixedLayoutWigdetComponent>
    </PositionedComponentLayer>
  );
};
