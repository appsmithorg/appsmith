import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { FlexVerticalAlignment } from "../utils/constants";

/**
 * AnvilViewerWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Viewer(Deployed Application Viewer) specific wrappers
 * needed in Anvil.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - AnvilFlexComponent: provides dimensions of a widget in anvil layout system.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */
export const AnvilViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilFlexComponent
      alignment={props.alignment}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      flexVerticalAlignment={
        props.flexVerticalAlignment || FlexVerticalAlignment.Bottom
      }
      focused={props.focused}
      hasAutoHeight={!!props.hasAutoHeight}
      hasAutoWidth={!!props.hasAutoWidth}
      isMobile={props.isMobile || false}
      isResizeDisabled={props.resizeDisabled}
      parentColumnSpace={props.parentColumnSpace}
      parentId={props.parentId}
      renderMode={props.renderMode}
      responsiveBehavior={props.responsiveBehavior}
      selected={props.selected}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetSize={props.widgetSize}
      widgetType={props.type}
    >
      <AnvilWidgetComponent {...props}>{props.childern}</AnvilWidgetComponent>
    </AnvilFlexComponent>
  );
};
