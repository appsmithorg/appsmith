import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import {
  useWidgetSizeConfiguration,
  type SizeConfig,
  defaultSizeConfig,
} from "../common/hooks/useWidgetSizeConfiguration";

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
  const widgetSize: SizeConfig | null = useWidgetSizeConfiguration(
    props.type,
    props,
  );
  return (
    <AnvilFlexComponent
      isResizeDisabled={props.resizeDisabled}
      parentId={props.parentId}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetSize={widgetSize || defaultSizeConfig}
      widgetType={props.type}
    >
      <AnvilWidgetComponent {...props}>{props.children}</AnvilWidgetComponent>
    </AnvilFlexComponent>
  );
};
