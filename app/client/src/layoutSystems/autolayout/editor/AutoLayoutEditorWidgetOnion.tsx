import SnipeableComponent from "layoutSystems/common/snipeable/SnipeableComponent";
import { get } from "lodash";
import React, { useCallback } from "react";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { WidgetNameLayer } from "../../common/widgetName/WidgetNameLayer";
import { AutoLayoutWidgetComponent } from "../common/widgetComponent/AutoLayoutWidgetComponent";
import FlexComponent from "../common/FlexComponent";
import DraggableComponent from "layoutSystems/common/draggable/DraggableComponent";
import { FlexVerticalAlignment } from "layoutSystems/common/utils/constants";
import { AutoResizableLayer } from "../common/resizer/AutoResizableLayer";
import { generateDragStateForFixedLayout } from "layoutSystems/fixedlayout/common/utils";

/**
 * AutoLayoutEditorWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Editor specific wrappers
 * needed in Auto Layout.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - FlexComponent: provides dimensions of a widget in auto-layout layout system.
 * - SnipeableComponent: provides ability to snipe a widget(Makes sure the widget is focused on Hover and allows the widget to be snipped on clicking on it)
 * - DraggableComponent: provides DnD html apis to make the widget draggable.
 * - WidgetNameLayer: provides the widget name in editing mode and also show error state if there are any.
 * - AutoResizableLayer: provides the resize handles required to set dimension for a widget.
 * - AutoLayoutWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */

export const AutoLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
  const {
    bottomRow,
    leftColumn,
    parentColumnSpace,
    parentId,
    parentRowSpace,
    rightColumn,
    topRow,
    widgetId,
  } = props;
  const generateDragState = useCallback(
    (e: React.DragEvent<Element>, draggableRef: HTMLElement) => {
      return generateDragStateForFixedLayout(e, draggableRef, {
        bottomRow,
        topRow,
        leftColumn,
        rightColumn,
        parentColumnSpace,
        parentRowSpace,
        parentId,
        widgetId,
      });
    },
    [
      bottomRow,
      topRow,
      leftColumn,
      rightColumn,
      parentRowSpace,
      parentColumnSpace,
      parentId,
      widgetId,
    ],
  );

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
      <SnipeableComponent type={props.type} widgetId={props.widgetId}>
        <DraggableComponent
          dragDisabled={!!props.dragDisabled}
          generateDragState={generateDragState}
          isFlexChild
          parentId={props.parentId}
          resizeDisabled={props.resizeDisabled}
          type={props.type}
          widgetId={props.widgetId}
        >
          <WidgetNameLayer
            componentWidth={props.componentWidth}
            detachFromLayout={props.detachFromLayout}
            disablePropertyPane={props.disablePropertyPane}
            evalErrorsObj={get(props, EVAL_ERROR_PATH, {})}
            parentId={props.parentId}
            topRow={props.topRow}
            type={props.type}
            widgetId={props.widgetId}
            widgetName={props.widgetName}
          >
            <AutoResizableLayer {...props}>
              <AutoLayoutWidgetComponent {...props}>
                {props.children}
              </AutoLayoutWidgetComponent>
            </AutoResizableLayer>
          </WidgetNameLayer>
        </DraggableComponent>
      </SnipeableComponent>
    </FlexComponent>
  );
};
