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
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      direction={props.direction || LayoutDirection.Horizontal}
      flexVerticalAlignment={
        props.flexVerticalAlignment || FlexVerticalAlignment.Bottom
      }
      focused={props.focused}
      isMobile={props.isMobile || false}
      isResizeDisabled={props.resizeDisabled}
      parentColumnSpace={props.parentColumnSpace}
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
