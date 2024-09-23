import React, { useMemo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import type { SizeConfig } from "WidgetProvider/constants";
import { getWidgetSizeConfiguration } from "../utils/widgetUtils";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";

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
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const widgetSize: SizeConfig = useMemo(
    () => getWidgetSizeConfiguration(props.type, props, isPreviewMode),
    [isPreviewMode, props.type],
  );

  return (
    <AnvilFlexComponent
      flexGrow={props.flexGrow}
      isVisible={!!props.isVisible}
      layoutId={props.layoutId}
      parentId={props.parentId}
      rowIndex={props.rowIndex}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetSize={widgetSize}
      widgetType={props.type}
    >
      <AnvilWidgetComponent {...props}>{props.children}</AnvilWidgetComponent>
    </AnvilFlexComponent>
  );
};
