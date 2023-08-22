import { WIDGET_PADDING } from "constants/WidgetConstants";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ResizableComponent from "components/editorComponents/ResizableComponent";

export const ResizableLayer = (props: BaseWidgetProps) => {
  if (props.resizeDisabled || props.type === "SKELETON_WIDGET") {
    return props.children;
  }
  return (
    <ResizableComponent {...props} paddingOffset={WIDGET_PADDING}>
      {props.children}
    </ResizableComponent>
  );
};
