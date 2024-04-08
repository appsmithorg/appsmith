import React from "react";
import { useMemo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import type { SizeConfig } from "WidgetProvider/constants";
import { getWidgetSizeConfiguration } from "../utils/widgetUtils";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { AnvilEditorFlexComponent } from "./AnvilEditorFlexComponent";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";

/**
 * AnvilEditorWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Editor specific wrappers
 * needed in Anvil.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - AnvilFlexComponent: provides dimensions of a widget in anvil layout system.
 * - SnipeableComponent: provides ability to snipe a widget(Makes sure the widget is focused on Hover and allows the widget to be snipped on clicking on it)
 * - DraggableComponent: provides DnD html apis to make the widget draggable.
 * - WidgetNameLayer: provides the widget name in editing mode and also show error state if there are any.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */
export const AnvilEditorWidgetOnion = (props: BaseWidgetProps) => {
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const widgetSize: SizeConfig = useMemo(
    () => getWidgetSizeConfiguration(props.type, props, isPreviewMode),
    [isPreviewMode, props.type],
  );
  const WidgetWrapper = useMemo(() => {
    return isPreviewMode ? AnvilFlexComponent : AnvilEditorFlexComponent;
  }, [isPreviewMode]);
  return (
    <WidgetWrapper
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
    </WidgetWrapper>
  );
};
