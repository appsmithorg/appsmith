import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { FixedLayoutWidgetComponent } from "../common/widgetComponent/FixedLayoutWidgetComponent";
import { PositionedComponentLayer } from "../common/PositionedComponentLayer";

/**
 * FixedLayoutViewerWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Viewer specific wrappers
 * needed in Fixed Layout.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - PositionedComponentLayer: provides dimensions of a widget in fixed-layout layout system.
 * - FixedLayoutWidgetComponent: provides layer to auto update height based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */

export const FixedLayoutViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <PositionedComponentLayer {...props}>
      <FixedLayoutWidgetComponent {...props}>
        {props.children}
      </FixedLayoutWidgetComponent>
    </PositionedComponentLayer>
  );
};
