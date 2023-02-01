import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { generateReactKey } from "utils/generators";
import { Widget } from "./positionUtils";

export function addNewCanvas(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
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
    rightColumn: existingCanvas.leftColumn + existingCanvasWidth / 2,
  };

  /**
   * Create a new canvas.
   */
  const newCanvasId = generateReactKey();

  const newCanvasPayload: any = {
    widgetId: parentId,
    type: "CANVAS_WIDGET",
    leftColumn: 0,
    topRow: 0,
    columns: existingCanvas.rightColumn - existingCanvas.leftColumn,
    rows: existingCanvas.bottomRow - existingCanvas.topRow,
    canExtend: true,
    parentRowSpace: 1,
    parentColumnSpace: 1,
    responsiveBehavior: "fill",
    newWidgetId: newCanvasId,
  };

  return { existingCanvas, newCanvasPayload };
}
