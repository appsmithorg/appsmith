import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoLayoutWidgetComponent } from "../common/widgetComponent/AutoLayoutWidgetComponent";
import FlexComponent from "../common/FlexComponent";
import { FlexVerticalAlignment } from "layoutSystems/common/utils/constants";

/**
 * AutoLayoutViewerWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Viewer(Deployed Application Viewer) specific wrappers
 * needed in Auto Layout.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - FlexComponent: provides dimensions of a widget in auto-layout layout system.
 * - AutoLayoutWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */

export const AutoLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <FlexComponent
      alignment={props.alignment}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
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
