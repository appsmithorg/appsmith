import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  getBottomRow,
  getTopRow,
  getWidgetMinMaxDimensionsInPixel,
  getWidgetRows,
  setDimensions,
} from "./flexWidgetUtils";

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

  if (widget.parentId && widgets[widget.parentId].type === "TABS_WIDGET") {
    return true;
  }

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
  widgets: CanvasWidgetsReduxState,
  computedHeight: number,
  mainCanvasWidth: number,
): number {
  let res: number = computedHeight;

  /**
   * add padding buffer for canvas.
   * if parentRowSpace === 1, => type === CANVAS_WIDGET
   */
  if (parent.type === "CANVAS_WIDGET")
    res +=
      parent.widgetId === MAIN_CONTAINER_WIDGET_ID
        ? GridDefaults.MAIN_CANVAS_EXTENSION_OFFSET
        : 2;

  /**
   * If widget is a Tabs widget, and tabs are visible,
   * add 4 rows to the height to accommodate the tab header.
   */
  if (parent.type === "TABS_WIDGET" && parent?.shouldShowTabs) res += 4;

  const minHeight: number =
    parent.widgetId !== MAIN_CONTAINER_WIDGET_ID
      ? (getWidgetMinMaxDimensionsInPixel(parent, mainCanvasWidth)?.minHeight ||
          0) / GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      : (parent.minHeight || 0) / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  /**
   * If the widget is a canvas widget and it's parent is not the main container,
   * then we need to check the parent's minHeight as well.
   * e.g. an empty canvas may require only 5 rows.
   * However a tab widget requires a min of 30 rows. So the child canvas must comply.
   */
  let containerMinHeight = 0;

  if (
    parent.type === "CANVAS_WIDGET" &&
    parent.parentId &&
    parent.parentId !== MAIN_CONTAINER_WIDGET_ID
  ) {
    const container = widgets[parent.parentId];

    containerMinHeight =
      (getWidgetMinMaxDimensionsInPixel(container, mainCanvasWidth)
        ?.minHeight || 0) / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    if (container.type === "TABS_WIDGET" && container?.shouldShowTabs)
      containerMinHeight -= 4;
  }

  res = Math.max(res, minHeight, containerMinHeight);

  return res;
}

/**
 * Set the new height of the parent widget.
 * @param parent | FlattenedWidgetProps : Parent widget.
 * @param height | number : Height to be set.
 * @param modalHeight | number : Height of the modal.
 * @param isMobile | boolean : Is mobile viewport.
 * @returns FlattenedWidgetProps
 */
export function updateParentHeight(
  parent: FlattenedWidgetProps,
  height: number,
  modalHeight: number,
  isMobile = false,
): FlattenedWidgetProps {
  const parentTopRow: number = getTopRow(parent, isMobile);
  let updatedParent = setDimensions(
    parent,
    parentTopRow,
    parentTopRow + height,
    null,
    null,
    isMobile,
  );

  /**
   * For Modal widget, set additional height property
   */
  if (parent.type === "MODAL_WIDGET") {
    // Add a couple of pixels to the modal height to avoid scrollbars.
    const bufferForModal = 2;

    updatedParent = {
      ...updatedParent,
      height: modalHeight + bufferForModal,
    };
  }

  return updatedParent;
}

/**
 * Get height of modal widget. => rows * rowSpace
 * @param parent | FlattenedWidgetProps
 * @param computedHeight | number
 * @param divisor | number
 * @returns number
 */
export function getModalHeight(
  parent: FlattenedWidgetProps,
  computedHeight: number,
  divisor: number,
): number {
  let res: number = computedHeight;

  // if (parent.parentRowSpace === 1) res -= 2;
  res *= divisor;

  if (parent.type === "MODAL_WIDGET")
    res *= divisor === 1 ? GridDefaults.DEFAULT_GRID_ROW_HEIGHT : 1;

  return res;
}

export function getDivisor(widget: FlattenedWidgetProps): number {
  return widget.type === "CANVAS_WIDGET"
    ? GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    : 1;
}

export function getContainerLikeWidgetHeight(
  widgets: CanvasWidgetsReduxState,
  parent: FlattenedWidgetProps,
  isMobile: boolean,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaProps?: Record<string, any>,
): number {
  if (!parent.children || !parent.children.length)
    return getWidgetRows(parent, isMobile);

  let children: string[] = parent?.children;

  /**
   * If the parent is a tabs widget,
   * then we need to get the selected tab widget id
   */
  if (parent.type === "TABS_WIDGET") {
    if (
      metaProps &&
      metaProps[parent.widgetId] &&
      metaProps[parent.widgetId]?.selectedTabWidgetId
    ) {
      children = [metaProps[parent.widgetId]?.selectedTabWidgetId];
    } else children = [parent.children[0]];
  }

  return getTotalRowsOfAllChildren(widgets, children, isMobile);
}

export function getTotalRowsOfAllChildren(
  widgets: CanvasWidgetsReduxState,
  children: string[],
  isMobile: boolean,
): number {
  if (!children || !children.length) return 0;

  let top = 10000,
    bottom = 0;

  for (const childId of children) {
    const child = widgets[childId];

    if (!child) continue;

    const divisor = getDivisor(child);

    top = Math.min(top, getTopRow(child, isMobile));
    bottom = Math.max(bottom, getBottomRow(child, isMobile) / divisor);
  }

  return bottom - top;
}
