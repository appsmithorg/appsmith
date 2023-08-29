import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoLayoutWidgetComponent } from "../common/AutoLayoutWidgetNameComponent";
import { FlexComponentLayer } from "../common/FlexComponentLayer";

export const AutoLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <FlexComponentLayer {...props}>
      <AutoLayoutWidgetComponent {...props}>
        {props.children}
      </AutoLayoutWidgetComponent>
    </FlexComponentLayer>
  );
};
