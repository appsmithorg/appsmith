import DraggableComponent from "layoutSystems/common/draggable/DraggableComponent";
import { get } from "lodash";
import React, { useCallback } from "react";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import SnipeableComponent from "../../common/snipeable/SnipeableComponent";
import { WidgetNameLayer } from "../../common/widgetName/WidgetNameLayer";
import { AutoHeightOverlayLayer } from "../common/autoHeight/AutoHeightOverlayLayer";
import { FixedLayoutWidgetComponent } from "../common/widgetComponent/FixedLayoutWidgetComponent";
import { FixedResizableLayer } from "../common/resizer/FixedResizableLayer";
import { PositionedComponentLayer } from "../common/PositionedComponentLayer";
import { generateDragStateForFixedLayout } from "../common/utils";

/**
 * FixedLayoutEditorWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Editor specific wrappers
 * needed in Fixed Layout.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - AutoHeightOverlayLayer: provides overlay to edit auto-height limits for a widget.
 * - PositionedComponentLayer: provides dimensions of a widget in fixed-layout layout system.
 * - SnipeableComponent: provides ability to snipe a widget(Makes sure the widget is focused on Hover and allows the widget to be snipped on clicking on it)
 * - DraggableComponent: provides DnD html apis to make the widget draggable.
 * - WidgetNameLayer: provides the widget name in editing mode and also show error state if there are any.
 * - FixedResizableLayer: provides the resize handles required to set dimension for a widget.
 * - FixedLayoutWidgetComponent: provides layer to auto update height based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */

export const FixedLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
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
      return generateDragStateForFixedLayout(e, draggableRef, props);
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
    <AutoHeightOverlayLayer {...props}>
      <PositionedComponentLayer {...props}>
        <SnipeableComponent type={props.type} widgetId={props.widgetId}>
          <DraggableComponent
            dragDisabled={!!props.dragDisabled}
            generateDragState={generateDragState}
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
              <FixedResizableLayer {...props}>
                <FixedLayoutWidgetComponent {...props}>
                  {props.children}
                </FixedLayoutWidgetComponent>
              </FixedResizableLayer>
            </WidgetNameLayer>
          </DraggableComponent>
        </SnipeableComponent>
      </PositionedComponentLayer>
    </AutoHeightOverlayLayer>
  );
};
