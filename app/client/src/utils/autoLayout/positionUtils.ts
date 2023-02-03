import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { WidgetProps } from "widgets/BaseWidget";
import {
  getBottomRow,
  getTopRow,
  getWidgetHeight,
  getWidgetRows,
  getWidgetWidth,
  setDimensions,
} from "./flexWidgetUtils";

export type Widget = WidgetProps & {
  children?: string[] | undefined;
};

export interface AlignmentInfo {
  alignment: FlexLayerAlignment;
  columns: number;
  children: Widget[];
}

export interface Row extends AlignmentInfo {
  height: number;
}

/**
 * Calculate widget position on canvas.
 * Logic -
 * 1. If widget contains flexLayers, then update positions for all widgets in layers.
 * 2. Else if widget contains children (implies fixed canvas), calculate the total height assumed by children.
 * 3. If totalChildrenHeight in either case > widgetHeight and widget.parent.type === ContainerWidget || MainContainer,
 *  then update height of the widget and its parent.
 */
export function updateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  isMobile = false,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  try {
    if (
      !widgets[MAIN_CONTAINER_WIDGET_ID].positioning ||
      widgets[MAIN_CONTAINER_WIDGET_ID].positioning === Positioning.Fixed
    )
      return widgets;
    const parent = widgets[parentId];
    if (!parent) return widgets;

    let height = 0;
    if (parent.flexLayers && parent.flexLayers?.length) {
      /**
       * For each flex layer, calculate position of child widgets
       * and calculate the total height of all layers.
       */
      for (const layer of parent.flexLayers) {
        const payload: {
          height: number;
          widgets: CanvasWidgetsReduxState;
        } = calculateWidgetPositions(widgets, layer, height, isMobile);
        widgets = payload.widgets;
        height += payload.height;
      }
    } else if (parent.children?.length) {
      // calculate the total height required by all widgets.
      height = getHeightOfFixedCanvas(widgets, parent, isMobile);
    } else return widgets;

    const divisor = parent.parentRowSpace === 1 ? 10 : 1;
    const parentHeight = getWidgetRows(parent, isMobile);
    if (parentHeight - height <= 1) {
      /**
       * if children height is greater than parent height,
       * update the parent height to match the children height
       * and add a buffer of 1 row to render the new layer highlights.
       */
      const parentTopRow = getTopRow(parent, isMobile);
      const updatedParent = setDimensions(
        parent,
        parentTopRow,
        parentTopRow + height * divisor + 1 * divisor,
        null,
        null,
        isMobile,
      );
      widgets = { ...widgets, [parent.widgetId]: updatedParent };

      const shouldUpdateHeight =
        parent.parentId &&
        ["CONTAINER_WIDGET", "CANVAS_WIDGET"].includes(
          allWidgets[parent.parentId].type,
        );
      // console.log(
      //   "#### update height",
      //   parent.widgetName,
      //   "parentHeight",
      //   parentHeight,
      //   "height",
      //   height,
      //   shouldUpdateHeight,
      //   parent.parentId ? widgets[parent.parentId].widgetName : "no parent",
      // );
      if (shouldUpdateHeight && parent.parentId)
        return updateWidgetPositions(widgets, parent.parentId, isMobile);
    }
    return widgets;
  } catch (e) {
    // console.error(e);
    return widgets;
  }
}

function calculateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  topRow: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  /**
   * Get information break down on each alignment within the layer.
   * Information - children, columns, alignment.
   * Also, retrieve the length of each fill widget within this layer.
   */
  const { fillWidgetLength, info } = extractAlignmentInfo(
    allWidgets,
    layer,
    isMobile,
  );
  /**
   * Check if this layer is wrapped by css flex.
   * if isMobile && totalColumns > 64 => true
   */
  const isFlexWrapped: boolean =
    isMobile &&
    info.reduce((acc, curr) => {
      return acc + curr.columns;
    }, 0) > GridDefaults.DEFAULT_GRID_COLUMNS;

  if (isFlexWrapped)
    return updatePositionsForFlexWrap(
      allWidgets,
      info,
      topRow,
      fillWidgetLength,
      isMobile,
    );

  return placeWidgetsWithoutWrap(
    allWidgets,
    info,
    topRow,
    fillWidgetLength,
    isMobile,
  );
}

/**
 *  Place all widgets in a particular row and update their positions.
 *
 * @param allWidgets | CanvasWidgetsReduxState : List of all widgets.
 * @param arr | AlignmentInfo[] : Array of all alignments to be placed in this row.
 * @param topRow | number : Starting row for placing the widgets.
 * @param fillWidgetLength | number : Size of each fill widget in this row.
 * @param isMobile : boolean : if the current viewport is mobile. default is false.
 * @param totalHeight | number : total height assumed by the widgets in this row.
 * @returns { height: number; widgets: CanvasWidgetsReduxState }
 */
export function placeWidgetsWithoutWrap(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  fillWidgetLength: number,
  isMobile = false,
  totalHeight = 0,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };
  /**
   * Get the size (columns: number) of each alignment in this row.
   */
  const { centerSize, endSize, startSize } = getAlignmentSizeInfo(arr);
  let maxHeight = totalHeight ? totalHeight : 0;
  for (const each of arr) {
    // Get the starting left column for each alignment in this row.
    let left = getStartingPosition(
      each.alignment,
      startSize,
      centerSize,
      endSize,
      each.columns,
    );
    for (const widget of each.children) {
      const height = getWidgetHeight(widget, isMobile);
      const width =
        widget.responsiveBehavior === ResponsiveBehavior.Fill
          ? fillWidgetLength
          : getWidgetWidth(widget, isMobile);
      if (!totalHeight) maxHeight = Math.max(maxHeight, height);
      const updatedWidget = setDimensions(
        widget,
        topRow,
        topRow + height,
        left,
        left + width,
        isMobile,
      );
      widgets = {
        ...widgets,
        [widget.widgetId]: {
          ...updatedWidget,
        },
      };
      left += width;
    }
  }

  return { height: maxHeight, widgets };
}

/**
 * Extract the space assumed by each alignment in the row.
 *  - Alignments are designed to grow and shrink equally. each starting with equal share of parent's width.
 *  - If one alignment needs more than its share of width to layout its children,
 *    then the remaining alignments shrink to make room, if possible.
 * Logic:
 *  - Sort the input alignments in descending order their column requirements.
 *  - if each.columns > space / input.length (i.e. the alignment needs more columns than it's starting share.)
 *    - add the alignment to the output array.
 *    - recursively repeat the exercise for the remaining alignments and remaining space.
 *  - attribute equal space to all alignments in input.
 * @param input | AlignmentInfo[] : Array of all alignments to be placed in this row.
 * @param space | number : Total space available for placing the widgets.
 * @param sizes | AlignmentInfo[] : Array of all alignments to be placed in this row.
 * @returns AlignmentInfo[]
 */
function getAlignmentSizes(
  input: AlignmentInfo[],
  space: number,
  sizes: AlignmentInfo[] = [],
): AlignmentInfo[] {
  if (input.length === 0) return sizes;
  const arr: AlignmentInfo[] = [...input].sort((a, b) => b.columns - a.columns);
  if (arr[0].columns > space / arr.length) {
    sizes.push(arr[0]);
    arr.shift();
    return getAlignmentSizes(
      arr,
      space - sizes[sizes.length - 1].columns,
      sizes,
    );
  } else {
    for (let i = 0; i < arr.length; i++) {
      sizes.push({ ...arr[i], columns: space / arr.length });
    }
  }
  return sizes;
}

/**
 * Breakdown the current flex layer to extract information on each child alignment.
 * Information for each alignment - children, columns, alignment.
 * @param widgets | CanvasWidgetsReduxState: List of all widgets.
 * @param layer | FlexLayer : current layer to be positioned on the canvas.
 * @param isMobile | boolean
 * @returns { info: AlignmentInfo[]; fillWidgetLength: number }
 */
export function extractAlignmentInfo(
  widgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  isMobile: boolean,
): { info: AlignmentInfo[]; fillWidgetLength: number } {
  const startChildren = [],
    centerChildren = [],
    endChildren = [],
    fillChildren = [];
  let startColumns = 0,
    centerColumns = 0,
    endColumns = 0;
  // Calculate the number of columns occupied by hug widgets in each alignment.
  for (const child of layer.children) {
    const widget = widgets[child.id];
    if (!widget) continue;
    const isFillWidget = widget.responsiveBehavior === ResponsiveBehavior.Fill;
    if (isFillWidget) fillChildren.push(child);
    if (child.align === FlexLayerAlignment.Start) {
      startChildren.push(widget);
      if (!isFillWidget) startColumns += getWidgetWidth(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
      if (!isFillWidget) centerColumns += getWidgetWidth(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      if (!isFillWidget) endColumns += getWidgetWidth(widget, isMobile);
    }
  }

  const availableColumns: number =
    GridDefaults.DEFAULT_GRID_COLUMNS -
    startColumns -
    centerColumns -
    endColumns;
  // Fill widgets are designed to take up parent's entire width on mobile viewport.
  const fillWidgetLength: number = isMobile
    ? GridDefaults.DEFAULT_GRID_COLUMNS
    : Math.min(availableColumns / fillChildren.length, 64);
  for (const child of fillChildren) {
    if (child.align === FlexLayerAlignment.Start) {
      startColumns += fillWidgetLength;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerColumns += fillWidgetLength;
    } else if (child.align === FlexLayerAlignment.End) {
      endColumns += fillWidgetLength;
    }
  }

  return {
    info: [
      {
        alignment: FlexLayerAlignment.Start,
        columns: startColumns,
        children: startChildren,
      },
      {
        alignment: FlexLayerAlignment.Center,
        columns: centerColumns,
        children: centerChildren,
      },
      {
        alignment: FlexLayerAlignment.End,
        columns: endColumns,
        children: endChildren,
      },
    ],
    fillWidgetLength,
  };
}

export function getAlignmentSizeInfo(
  arr: AlignmentInfo[],
): { startSize: number; centerSize: number; endSize: number } {
  let startSize = 0,
    centerSize = 0,
    endSize = 0;
  const sizes: {
    alignment: FlexLayerAlignment;
    columns: number;
  }[] = getAlignmentSizes(arr, GridDefaults.DEFAULT_GRID_COLUMNS, []);

  for (const each of sizes) {
    if (each.alignment === FlexLayerAlignment.Start) {
      startSize = each.columns;
    } else if (each.alignment === FlexLayerAlignment.Center) {
      centerSize = each.columns;
    } else if (each.alignment === FlexLayerAlignment.End) {
      endSize = each.columns;
    }
  }
  return { startSize, centerSize, endSize };
}

/**
 * Find out which alignment is placed in which row.
 *
 * In case of flex wrap,
 * - alignments within a FlexLayer are placed in multiple rows.
 * Logic:
 *  - for each alignment in arr
 *    - if alignment.columns < 64
 *      -  add it to the current row (res[resIndex])
 *      - and track the total occupied columns in this row (total)
 *    - else
 *     - add the current row to the output rows
 *    - and start a new row to repeat the process recursively.
 * @param arr | AlignmentInfo[] : Array of alignments to be placed in this layer.
 * @param res | AlignmentInfo[][] : Output array of alignments to be placed in this layer.
 * @param resIndex | number : Last index of res.
 * @returns AlignmentInfo[][]
 */
export function getWrappedAlignmentInfo(
  arr: AlignmentInfo[],
  res: AlignmentInfo[][] = [[], [], []],
  resIndex = 0,
): AlignmentInfo[][] {
  if (arr.length === 1) {
    res[resIndex].push(arr[0]);
    return res;
  }
  let index = 0;
  let total = 0;
  for (const each of arr) {
    if (total + each.columns > GridDefaults.DEFAULT_GRID_COLUMNS) {
      let x = index;
      if (!res[resIndex].length) {
        res[resIndex].push(each);
        x += 1;
      }
      return getWrappedAlignmentInfo([...arr.slice(x)], res, resIndex + 1);
    }
    total += each.columns;
    index += 1;
    res[resIndex].push(each);
  }
  return res;
}

/**
 * @param allWidgets | CanvasWidgetsReduxState: all widgets.
 * @param arr | AlignmentInfo[] : Array of alignments to be placed in this layer.
 * @param topRow | number : Starting row to place the widgets.
 * @param fillWidgetLength | number : Length of fill widgets.
 * @param isMobile | boolean : Is mobile viewport.
 * @returns { height: number; widgets: CanvasWidgetsReduxState }
 */
function updatePositionsForFlexWrap(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  fillWidgetLength: number,
  isMobile: boolean,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };

  const wrappedAlignments: AlignmentInfo[][] = getWrappedAlignmentInfo(arr);

  let top = topRow;
  for (const each of wrappedAlignments) {
    if (!each.length) break;
    // if there is only one alignment in this row, this implies that it may be wrapped.
    const payload =
      each.length === 1
        ? placeWrappedWidgets(widgets, each[0], top, fillWidgetLength, isMobile)
        : placeWidgetsWithoutWrap(
            widgets,
            each,
            top,
            fillWidgetLength,
            isMobile,
          );
    widgets = payload.widgets;
    top += payload.height;
    continue;
  }
  return { height: top - topRow, widgets };
}

export function getStartingPosition(
  alignment: FlexLayerAlignment,
  startSize: number,
  centerSize: number,
  endSize: number,
  columns: number,
): number {
  if (alignment === FlexLayerAlignment.Start) {
    return 0;
  } else if (alignment === FlexLayerAlignment.Center) {
    return startSize + centerSize / 2 - columns / 2;
  } else if (alignment === FlexLayerAlignment.End) {
    return startSize + centerSize + endSize - columns;
  }
  return 0;
}

/**
 * If the alignment requires more than 64 columns, it is wrapped.
 * => a single alignment spans multiple layers.
 * Logic:
 *  - Find out the number of rows required to position the widgets in the alignment.
 *  - Place each row normally.
 * @param allWidgets | CanvasWidgetsReduxState: all widgets.
 * @param alignment | AlignmentInfo: alignment to be positioned.
 * @param topRow | number: top row to place the widgets.
 * @param fillWidgetLength | number: length of fill widgets.
 * @param isMobile | boolean: is mobile viewport.
 * @returns { height: number; widgets: CanvasWidgetsReduxState }
 */
export function placeWrappedWidgets(
  allWidgets: CanvasWidgetsReduxState,
  alignment: AlignmentInfo,
  topRow: number,
  fillWidgetLength: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };

  let startRow = topRow;
  const rows: Row[] = getWrappedRows(alignment, [], isMobile);
  for (const row of rows) {
    const { alignment, children, columns, height } = row;
    const result: {
      height: number;
      widgets: CanvasWidgetsReduxState;
    } = placeWidgetsWithoutWrap(
      widgets,
      [{ alignment, children, columns }],
      startRow,
      fillWidgetLength,
      isMobile,
      height,
    );
    widgets = result.widgets;
    startRow += height;
  }

  return { height: startRow - topRow, widgets };
}

/**
 * Find out the number of rows required to position all the widgets in the given alignment.
 * - for each child
 *   - if total columns < 64
 *     - add it to the current row.
 *     - track the total consumed columns.
 *     - track the height of the current row.
 *   - else
 *     - add the current row to the output array.
 *     - recursively continue the process for remaining children.
 * @param arr | AlignmentInfo: alignment to be positioned.
 * @param rows | Row[]: output rows.
 * @param isMobile | boolean: is mobile viewport.
 * @returns Row[]
 */
export function getWrappedRows(
  arr: AlignmentInfo,
  rows: Row[],
  isMobile = false,
): Row[] {
  const row: Row = {
    alignment: arr.alignment,
    children: [],
    columns: 0,
    height: 0,
  };
  const space = GridDefaults.DEFAULT_GRID_COLUMNS;
  const temp: Widget[] = [];
  let columns = 0,
    index = 0,
    maxHeight = 0;
  for (const child of arr.children) {
    const width = getWidgetWidth(child, isMobile);
    if (columns + width > space) {
      row.children.push(...temp);
      row.height = maxHeight;
      row.columns = columns;
      rows.push(row);
      return getWrappedRows(
        {
          ...arr,
          children: [...arr.children.slice(index)],
        },
        [...rows],
        isMobile,
      );
    }
    temp.push(child);
    maxHeight = Math.max(maxHeight, getWidgetHeight(child, isMobile));
    columns += width;
    index += 1;
  }
  if (temp.length) {
    row.children.push(...temp);
    row.height = maxHeight;
    row.columns = columns;
    rows.push(row);
  }
  return rows;
}

function getHeightOfFixedCanvas(
  widgets: CanvasWidgetsReduxState,
  parent: Widget,
  isMobile: boolean,
): number {
  if (!parent.children || !parent.children.length)
    return getWidgetRows(parent, isMobile);
  return getTotalRowsOfAllChildren(widgets, parent.children, isMobile);
}

export function getTotalRowsOfAllChildren(
  widgets: CanvasWidgetsReduxState,
  children: string[],
  isMobile: boolean,
): number {
  let top = 10000,
    bottom = 0;
  for (const childId of children) {
    const child = widgets[childId];
    if (!child) continue;
    const divisor = child.parentRowSpace === 1 ? 10 : 1;
    top = Math.min(top, getTopRow(child, isMobile));
    bottom = Math.max(bottom, getBottomRow(child, isMobile) / divisor);
  }
  return bottom - top;
}
