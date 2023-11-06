import type { MutableRefObject } from "react";
import type { Stage as CanvasStageType } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";

import type {
  CanvasPositions,
  WIDGET_NAME_TYPE,
  WidgetNameData,
  WidgetNamePositionType,
} from "./WidgetNameTypes";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getWidgetNameComponent } from "./utils";
import type { KonvaEventListener } from "konva/lib/Node";
import type { Group } from "konva/lib/Group";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";

export function getMainContainerAnvilCanvasDOMElement() {
  return document.getElementById(CANVAS_VIEWPORT) as HTMLDivElement | null;
}

/**
 * Resets canvas when there is nothing to be drawn on canvas
 */
export function resetCanvas(
  widgetNamePositions: MutableRefObject<WidgetNamePositionType>,
  stageRef: MutableRefObject<CanvasStageType | null>,
  keepRef = false,
) {
  if (!keepRef) {
    // Resets stored widget position names
    widgetNamePositions.current = { selected: {}, focused: {} };
  }

  // clears all drawings on canvas
  const stage = stageRef.current;
  if (!stage) return;
  const layer = stage.getLayers()[0];
  if (!layer) return;
  layer.destroyChildren();
  layer.draw();
}

/**
 * This method is used to draw the widget name components on the canvas for the
 * selected and focused widgets.
 * 1. It loops through all the selected widgets and draws the names for all of them
 * 2. It draws the name for the focused widget
 *
 * ALL of the arguments are passed down to the `addWidgetNameToCanvas` method
 * except for `stageRef` which is used to get the Konva stage and layer and the
 * selectedWidgetNameData and focusedWidgetNameData which are used to call individual
 * `addWidgetNameToCanvas` methods.
 *
 * This method finally draws the layer to commit the changes computed by `addWidgetNameToCanvas` calls
 *
 */
export const updateSelectedWidgetPositions = (props: {
  stageRef: MutableRefObject<CanvasStageType | null>;
  selectedWidgetNameData: WidgetNameData[] | undefined;
  focusedWidgetNameData: WidgetNameData | undefined;
  selectWidget: (
    type: SelectionRequestType,
    payload?: string[] | undefined,
  ) => void;
  scrollTop: MutableRefObject<number>;
  widgetNamePositions: MutableRefObject<WidgetNamePositionType>;
  canvasPositions: MutableRefObject<CanvasPositions>;
}) => {
  const {
    canvasPositions,
    focusedWidgetNameData,
    scrollTop,
    selectedWidgetNameData,
    selectWidget,
    stageRef,
    widgetNamePositions,
  } = props;
  if (!stageRef?.current) return;

  const stage = stageRef.current;
  const layer = stage.getLayers()[0];
  // Clean up the layer so that we can update all the widget names
  layer.destroyChildren();

  // For each selected widget, draw the widget name
  if (selectedWidgetNameData && selectedWidgetNameData.length > 0) {
    widgetNamePositions.current.selected = {};
    for (const widgetNameData of selectedWidgetNameData) {
      addWidgetNameToCanvas(
        layer,
        widgetNameData,
        "selected",
        selectWidget,
        scrollTop,
        stageRef,
        widgetNamePositions,
        canvasPositions,
      );
    }
  }

  // Draw the focused widget name
  if (focusedWidgetNameData) {
    widgetNamePositions.current.focused = {};

    addWidgetNameToCanvas(
      layer,
      focusedWidgetNameData,
      "focused",
      selectWidget,
      scrollTop,
      stageRef,
      widgetNamePositions,
      canvasPositions,
    );
  }

  layer.draw();
};

/**
 * This method adds the widget name on the canvas and adds the click event handler to the widget name component
 *
 * @param layer : The KonvaLayer on which to draw
 * @param widgetNameData : the WidgetName data for the widget
 * @param type: Whether we need to draw the selected or focused widget name
 * @param selectWidget: The selectWidget method to call when the widget name is clicked
 * @param scrollTop: The amount of pixels scrolled by the canvas
 * @param stageRef: The Konva stage reference
 * @param widgetNamePositions: The widget name positions (selected and focused)
 * @param canvasPositions: The canvas positions
 * @returns void
 */
export const addWidgetNameToCanvas = (
  layer: KonvaLayer,
  widgetNameData: WidgetNameData,
  type: WIDGET_NAME_TYPE,
  selectWidget: (
    type: SelectionRequestType,
    payload?: string[] | undefined,
  ) => void,
  scrollTop: MutableRefObject<number>,
  stageRef: MutableRefObject<CanvasStageType | null>,
  widgetNamePositions: MutableRefObject<WidgetNamePositionType>,
  canvasPositions: MutableRefObject<CanvasPositions>,
) => {
  // If we don't have the positions, return
  if (!widgetNameData.position) return;

  const { id: widgetId, widgetName } = widgetNameData;

  // Get the scroll parent to calculate the offsets
  const scrollParent = getMainContainerAnvilCanvasDOMElement();

  // If we have a widget name
  // Use Konva APIs to draw the text (see `getWidgetNameComponent`)
  if (widgetName) {
    const {
      canvasLeftOffset,
      canvasTopOffset,
      widgetNameComponent,
      widgetNamePosition,
    } = getWidgetNameComponent(
      widgetName,
      widgetNameData,
      scrollParent,
      stageRef?.current?.content,
      scrollTop.current,
    );

    // Store the drawn widget name position
    widgetNamePositions.current[type][widgetNamePosition.widgetNameData.id] = {
      ...widgetNamePosition,
    };

    // Update the Canvas positions' x and y diffs
    canvasPositions.current = {
      ...canvasPositions.current,
      xDiff: canvasLeftOffset,
      yDiff: canvasTopOffset,
    };

    // Create Konva event handler
    // Note: The stopPropagation() doesn't seem to be working, so another workaround has been added to the WidgetsEditor component
    const eventHandler: KonvaEventListener<Group, MouseEvent> = (
      konvaEvent,
    ) => {
      selectWidget(SelectionRequestType.One, [widgetId]);
      konvaEvent.cancelBubble = true;
      konvaEvent.evt.stopPropagation();
    };

    //Make widget name clickable
    widgetNameComponent.on("mousedown", eventHandler);

    //Add widget name to canvas
    layer.add(widgetNameComponent);
  }
};
