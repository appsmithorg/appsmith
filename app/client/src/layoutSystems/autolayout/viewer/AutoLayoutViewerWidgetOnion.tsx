import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoLayoutWidgetComponent } from "../common/widgetComponent/AutoLayoutWidgetComponent";
import FlexComponent from "../common/FlexComponent";
import { FlexVerticalAlignment, LayoutDirection } from "../utils/constants";

export const AutoLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
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
      <AutoLayoutWidgetComponent {...props}>
        {props.children}
      </AutoLayoutWidgetComponent>
    </FlexComponent>
  );
};
