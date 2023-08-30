import React from "react";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { ResizableComponent } from "layoutSystems/common/resizer/ResizableComponent";

export const AutoResizableLayer = (props: BaseWidgetProps) => {
  if (props.resizeDisabled || props.type === "SKELETON_WIDGET") {
    return props.children;
  }
  let autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
    props.type,
  ).autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(props);
  }
  return (
    <ResizableComponent
      {...props}
      hasAutoHeight={autoDimensionConfig?.height}
      hasAutoWidth={autoDimensionConfig?.width}
      paddingOffset={WIDGET_PADDING}
    >
      {props.children}
    </ResizableComponent>
  );
};
