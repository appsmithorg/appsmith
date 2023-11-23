import React, { useCallback } from "react";
import { useMemo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import DraggableComponent from "layoutSystems/common/draggable/DraggableComponent";
import { AnvilResizableLayer } from "../common/resizer/AnvilResizableLayer";
import { generateDragStateForAnvilLayout } from "../utils/widgetUtils";
import type { SizeConfig } from "WidgetProvider/constants";
import { getWidgetSizeConfiguration } from "../utils/widgetUtils";

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
  const { layoutId } = props;
  // if layoutId is not present on widget props then we need a selector to fetch layout id of a widget.
  // const layoutId = useSelector(getLayoutIdByWidgetId(props.widgetId));
  const generateDragState = useCallback(() => {
    return generateDragStateForAnvilLayout({
      layoutId,
    });
  }, [layoutId]);
  const widgetSize: SizeConfig = useMemo(
    () => getWidgetSizeConfiguration(props.type, props),
    [props.type],
  );

  return (
    <AnvilFlexComponent
      isResizeDisabled={props.resizeDisabled}
      isVisible={!!props.isVisible}
      layoutId={props.layoutId}
      parentId={props.parentId}
      rowIndex={props.rowIndex}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetSize={widgetSize}
      widgetType={props.type}
    >
      <DraggableComponent
        dragDisabled={!!props.dragDisabled}
        generateDragState={generateDragState}
        isFlexChild
        parentId={props.parentId}
        resizeDisabled={props.resizeDisabled}
        type={props.type}
        widgetId={props.widgetId}
      >
        <AnvilResizableLayer {...props}>
          <AnvilWidgetComponent {...props}>
            {props.children}
          </AnvilWidgetComponent>
        </AnvilResizableLayer>
      </DraggableComponent>
    </AnvilFlexComponent>
  );
};
