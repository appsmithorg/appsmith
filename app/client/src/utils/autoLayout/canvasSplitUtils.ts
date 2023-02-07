import { FlexLayer } from "./autoLayoutTypes";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { generateReactKey } from "utils/generators";
import { updateRelationships } from "./autoLayoutDraggingUtils";
import { CanvasSplitTypes } from "./canvasSplitProperties";
import { ResponsiveBehavior } from "./constants";
import { Widget } from "./positionUtils";

/**
 * Add a new canvas within the given parent.
 * -> reduce the width of the current canvas to half.
 * -> create a payload for creating a new canvas.
 * @param allWidgets | CanvasWidgetsReduxState : all widgets in the canvas
 * @param parentId | string : parent widget.
 * @returns { existingCanvas: Widget; newCanvasPayload: any } | undefined
 */
export function addNewCanvas(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  ratios: number[],
): { existingCanvas: Widget; newCanvasPayload: any } | undefined {
  if (!parentId) return;
  const widgets = { ...allWidgets };
  const parent = widgets[parentId];
  if (!parent || !parent.children) return;

  /**
   * Assuming that canvas split introduces at max 1 new canvas,
   * then the existing canvas is used as a reference to add / delete the new canvas.
   */
  const existingCanvasId: string = parent.children[0];
  let existingCanvas: Widget = widgets[existingCanvasId];

  /**
   * Shrink the existing canvas.
   */
  const existingCanvasWidth =
    existingCanvas.rightColumn - existingCanvas.leftColumn;
  existingCanvas = {
    ...existingCanvas,
    rightColumn: existingCanvas.leftColumn + existingCanvasWidth * ratios[0],
    canvasSplitRatio: ratios[0],
  };

  /**
   * Create a new canvas.
   */
  const newCanvasId = generateReactKey();

  const newCanvasPayload: any = {
    widgetId: parentId,
    type: "CANVAS_WIDGET",
    leftColumn: existingCanvas.rightColumn,
    topRow: 0,
    columns: existingCanvas.rightColumn + existingCanvasWidth * ratios[1],
    rows: existingCanvas.bottomRow - existingCanvas.topRow,
    canExtend: true,
    parentRowSpace: 1,
    parentColumnSpace: 1,
    responsiveBehavior: ResponsiveBehavior.Fill,
    newWidgetId: newCanvasId,
    props: {
      canvasSplitRatio: ratios[1],
    },
  };

  return { existingCanvas, newCanvasPayload };
}

export function deleteCanvas(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  canvasSplitType: CanvasSplitTypes,
  isMobile: boolean,
): CanvasWidgetsReduxState {
  if (!parentId) return allWidgets;
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  if (!parent || !parent.children) return widgets;

  /**
   * Assuming that canvas split introduces at max 1 new canvas,
   * then the existing canvas is used as a reference to add / delete the new canvas.
   */
  const remainingCanvasId: string = parent.children[0];
  let remainingCanvas: Widget = widgets[remainingCanvasId];

  /**
   * Delete the second canvas.
   */
  const selectedCanvasId: string = parent.children[1];
  const selectedCanvas: Widget = widgets[selectedCanvasId];
  const selectedChildren: string[] = selectedCanvas.children || [];
  const selectedFlexLayers: FlexLayer[] = selectedCanvas.flexLayers || [];
  widgets = updateRelationships(
    selectedChildren,
    widgets,
    remainingCanvasId,
    false,
    isMobile,
  );
  delete widgets[selectedCanvasId];

  /**
   * Expand the remaining canvas.
   */
  const remainingCanvasWidth =
    remainingCanvas.rightColumn - remainingCanvas.leftColumn;

  remainingCanvas = {
    ...remainingCanvas,
    rightColumn: remainingCanvas.leftColumn + remainingCanvasWidth * 2,
    flexLayers: [...(remainingCanvas.flexLayers || []), ...selectedFlexLayers],
    children: [...(remainingCanvas.children || []), ...selectedChildren],
    canvasSplitRatio: 1,
  };

  widgets = {
    ...widgets,
    [remainingCanvasId]: remainingCanvas,
    [parentId]: {
      ...parent,
      children: [remainingCanvasId],
      canvasSplitType,
    },
  };

  return widgets;
}
