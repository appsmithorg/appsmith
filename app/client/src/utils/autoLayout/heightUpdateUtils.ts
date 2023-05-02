import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { FlattenedWidgetProps } from "widgets/constants";

/**
 * Determine whether the parent height should be updated or not.
 * 1. Update if computed height of all children is not equal to parent height.
 * 2. Do not update if the widget is a list item container.
 * @param widget | FlattenedWidgetProps : Current widget.
 * @param widgets | CanvasWidgetsReduxState : All widgets.
 * @param parentHeight | number : Current height of the widget.
 * @param computedHeight | number : Min height required to render all children.
 * @param mainCanvasWidth | number : Width of the main canvas.
 * @returns boolean
 */
export function shouldUpdateParentHeight(
  widgets: CanvasWidgetsReduxState,
  widget: FlattenedWidgetProps,
  computedHeight: number,
  parentHeight: number,
): boolean {
  if (
    widget?.isListItemContainer ||
    (widget.parentId && widgets[widget.parentId].type === "LIST_WIDGET_V2") ||
    widget.type === "LIST_WIDGET_V2"
  )
    return false;
  // console.log("#### here", widget.widgetName, computedHeight, parentHeight);
  return computedHeight !== parentHeight;
}

/**
 * Compute total height required by the canvas.
 * @param parent | FlattenedWidgetProps : Parent widget.
 * @param computedHeight | number : Min height required to render all children.
 * @returns number
 */
export function getComputedHeight(
  parent: FlattenedWidgetProps,
  // widgets: CanvasWidgetsReduxState,
  computedHeight: number,
  // mainCanvasWidth: number,
): number {
  let res: number = computedHeight;
  /**
   * add padding buffer for canvas.
   * if parentColumnSpace === 1, => type === CANVAS_WIDGET
   */
  if (parent.parentRowSpace === 1) res += 2;

  /**
   * If widget is a Tabs widget, and tabs are visible,
   * add 4 rows to the height to accommodate the tab header.
   */
  if (parent.type === "TABS_WIDGET" && parent?.shouldShowTabs) res += 4;
  return res;
}
