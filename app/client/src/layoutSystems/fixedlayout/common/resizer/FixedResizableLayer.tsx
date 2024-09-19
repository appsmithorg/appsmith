import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { memo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { ResizableComponent } from "layoutSystems/common/resizer/ResizableComponent";

export const FixedResizableLayer = memo((props: BaseWidgetProps) => {
  if (props.resizeDisabled || props.type === "SKELETON_WIDGET") {
    return props.children;
  }

  return (
    <ResizableComponent {...props} paddingOffset={WIDGET_PADDING}>
      {props.children}
    </ResizableComponent>
  );
});
