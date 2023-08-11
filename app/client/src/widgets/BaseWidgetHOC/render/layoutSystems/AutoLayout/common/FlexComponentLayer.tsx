import FlexComponent from "components/designSystems/appsmith/autoLayout/FlexComponent";
import React from "react";
import {
  FlexVerticalAlignment,
  LayoutDirection,
} from "utils/autoLayout/constants";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const FlexComponentLayer = (props: BaseWidgetProps) => {
  return (
    <FlexComponent
      alignment={props.alignment}
      childIndex={props.childIndex}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      direction={props.direction || LayoutDirection.Horizontal}
      flexVerticalAlignment={
        props.flexVerticalAlignment || FlexVerticalAlignment.Bottom
      }
      focused={props.focused}
      hasAutoHeight={props.autoDimensionConfig?.height}
      hasAutoWidth={props.autoDimensionConfig?.width}
      isResizeDisabled={props.resizeDisabled}
      mainCanvasWidth={props.mainCanvasWidth}
      parentId={props.parentId}
      renderMode={props.renderMode}
      responsiveBehavior={props.responsiveBehavior}
      selected={props.selected}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetType={props.type}
    >
      {props.children}
    </FlexComponent>
  );
};
