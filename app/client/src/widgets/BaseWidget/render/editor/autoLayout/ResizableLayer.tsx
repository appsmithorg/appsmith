import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import React from "react";
import AutoLayoutResizableComponent from "components/editorComponents/WidgetResizer/AutoLayoutResizableComponent";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";

export const ResizableLayer = (props: BaseWidgetProps) => {
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
    <AutoLayoutResizableComponent
      {...props}
      hasAutoHeight={autoDimensionConfig?.height}
      hasAutoWidth={autoDimensionConfig?.width}
      paddingOffset={WIDGET_PADDING}
    >
      {props.children}
    </AutoLayoutResizableComponent>
  );
};
