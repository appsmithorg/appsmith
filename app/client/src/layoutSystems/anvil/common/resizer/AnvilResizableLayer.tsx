import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const AnvilResizableLayer = (props: BaseWidgetProps) => {
  if (props.resizeDisabled || props.type === "SKELETON_WIDGET") {
    return props.children;
  }
  // TODO: Does anvil need a new ResizableComponent?
  return <div className="w-full h-full">{props.children}</div>;
};
