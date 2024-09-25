import type {
  AlignmentChildren,
  AlignmentInfo,
  Row,
} from "../../autolayout/utils/types";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  FlexLayerAlignment,
  MOBILE_ROW_GAP,
  Positioning,
  ResponsiveBehavior,
  ROW_GAP,
} from "layoutSystems/common/utils/constants";
import {
  getWidgetHeight,
  getWidgetMinMaxDimensionsInPixel,
  getWidgetRows,
  getWidgetWidth,
  setDimensions,
} from "./flexWidgetUtils";
import { getCanvasDimensions } from "./AutoLayoutUtils";
import WidgetFactory from "WidgetProvider/factory";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import { isFunction } from "lodash";
import {
  getComputedHeight,
  getDivisor,
  getContainerLikeWidgetHeight,
  getModalHeight,
  shouldUpdateParentHeight,
  updateParentHeight,
} from "./heightUpdateUtils";
import type { FlexLayer, LayerChild } from "./types";

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
  mainCanvasWidth: number,
  firstTimeDSLUpdate = false,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaProps?: Record<string, any>,
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

    const { columnSpace } = getCanvasDimensions(
      parent,
      widgets,
      mainCanvasWidth,
      isMobile,
    );

    let height = 0;
    const rowGap =
      (isMobile ? MOBILE_ROW_GAP : ROW_GAP) /
      GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    if (parent.flexLayers && parent.flexLayers?.length) {
      /**
       * For each flex layer, calculate position of child widgets
       * and calculate the total height of all layers.
       */
      for (const layer of parent.flexLayers) {
        const payload: {
          height: number;
          widgets: CanvasWidgetsReduxState;
        } = calculateWidgetPositions(
          widgets,
          layer,
          height,
          isMobile,
          mainCanvasWidth,
          columnSpace,
          firstTimeDSLUpdate,
        );

        widgets = payload.widgets;
        height += payload.height + rowGap; // Add rowGap after each layer.
      }

      // subtract rowGap from height to account for the last layer.
      height -= rowGap;
    } else if (parent.children?.length) {
      // calculate the total height required by all widgets.
      height = getContainerLikeWidgetHeight(
        widgets,
        parent,
        isMobile,
        metaProps,
      );
    } else if (parent.type === "CANVAS_WIDGET" && parent.parentId) {
      // Set a minimal height of an empty canvas to trigger height calculation for parent.
      height = 1;
    } else return widgets;

    const divisor = getDivisor(parent);

    const parentHeight = getWidgetRows(parent, isMobile);
    const computedHeight: number = getComputedHeight(
      parent,
      widgets,
      height,
      mainCanvasWidth,
    );

    if (
      shouldUpdateParentHeight(widgets, parent, computedHeight, parentHeight)
    ) {
      const updatedParent: FlattenedWidgetProps = updateParentHeight(
        parent,
        computedHeight * divisor,
        getModalHeight(parent, computedHeight, divisor),
        isMobile,
      );

      widgets = { ...widgets, [parent.widgetId]: updatedParent };

      if (parent.parentId)
        return updateWidgetPositions(
          widgets,
          parent.parentId,
          isMobile,
          mainCanvasWidth,
          firstTimeDSLUpdate,
          metaProps,
        );
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
  mainCanvasWidth: number,
  columnSpace: number,
  firstTimeDSLUpdate: boolean,
): { height: number; widgets: CanvasWidgetsReduxState } {
  /**
   * Get information break down on each alignment within the layer.
   * Information - children, columns, alignment.
   * Also, retrieve the length of each fill widget within this layer.
   */
  const { info } = extractAlignmentInfo(
    allWidgets,
    layer,
    isMobile,
    mainCanvasWidth,
    columnSpace,
    firstTimeDSLUpdate,
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
    return updatePositionsForFlexWrap(allWidgets, info, topRow, isMobile);

  return placeWidgetsWithoutWrap(allWidgets, info, topRow, isMobile);
}

/**
 *  Place all widgets in a particular row and update their positions.
 *
 * @param allWidgets | CanvasWidgetsReduxState : List of all widgets.
 * @param arr | AlignmentInfo[] : Array of all alignments to be placed in this row.
 * @param topRow | number : Starting row for placing the widgets.
 * @param isMobile : boolean : if the current viewport is mobile. default is false.
 * @param totalHeight | number : total height assumed by the widgets in this row.
 * @returns { height: number; widgets: CanvasWidgetsReduxState }
 */
export function placeWidgetsWithoutWrap(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
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

    for (const child of each.children) {
      const { columns, rows, widget } = child;

      if (!totalHeight) maxHeight = Math.max(maxHeight, rows);

      const updatedWidget = setDimensions(
        widget,
        topRow,
        topRow + rows,
        left,
        left + columns,
        isMobile,
      );

      widgets = {
        ...widgets,
        [widget.widgetId]: {
          ...updatedWidget,
        },
      };
      left += columns;
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
 *  1. Information for each alignment - children, columns, alignment.
 *  2. Length of each fill widget within this layer.
 *  3. Total number of columns and rows occupied by hug widgets in this layer.
 *
 * Logic:
 * - Iterate over all children of the layer.
 * - If the child is a widget, then add it to the corresponding alignment array.
 * - for each child:
 *   - Get widget's size (columns, rows).
 *    - if  columns < minWidth => calculate the number of columns based on minWidth.
 *   - store columns and rows information of each child.
 *   - if alignment is fill => store min columns and rows information of each child.
 * - availableColumns = 64 - totalColumns occupied by hug widgets.
 * - for each fill child (sorted in descending order of minWidth):
 *  - if minWidth > availableColumns / # of fill widgets => assign columns based on minWidth and update fillLength for remaining fill widgets.
 * @param widgets | CanvasWidgetsReduxState: List of all widgets.
 * @param layer | FlexLayer : current layer to be positioned on the canvas.
 * @param isMobile | boolean
 * @param mainCanvasWidth | number: width of the main canvas.
 * @param columnSpace | number
 * @returns { info: AlignmentInfo[]; fillWidgetLength: number }
 */
export function extractAlignmentInfo(
  widgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  isMobile: boolean,
  mainCanvasWidth: number,
  columnSpace: number,
  firstTimeDSLUpdate: boolean,
): { info: AlignmentInfo[]; fillWidgetLength: number } {
  const startChildren: AlignmentChildren[] = [],
    centerChildren: AlignmentChildren[] = [],
    endChildren: AlignmentChildren[] = [],
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fillChildren: any[] = [];
  let startColumns = 0,
    centerColumns = 0,
    endColumns = 0;

  // Calculate the number of columns occupied by hug widgets in each alignment.
  for (const child of layer.children) {
    const widget = widgets[child.id];

    if (!widget) continue;

    let columns = getWidgetWidth(widget, isMobile);
    let rows = getWidgetHeight(widget, isMobile);
    const { minHeight, minWidth } = getWidgetMinMaxDimensionsInPixel(
      widget,
      mainCanvasWidth,
    );
    const rowSpace = widget.detachFromLayout
      ? 1
      : GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    const isFillWidget = widget.responsiveBehavior === ResponsiveBehavior.Fill;

    let { disableResizeHandles } = WidgetFactory.getWidgetAutoLayoutConfig(
      widget.type,
    );

    if (isFunction(disableResizeHandles)) {
      disableResizeHandles = disableResizeHandles(widget);
    }

    // For hug widgets with horizontal resizing enabled,
    // make sure the width is not getting greater than user defined width
    if (!isFillWidget && !disableResizeHandles?.horizontal) {
      if (!isMobile && widget.widthInPercentage) {
        columns = Math.round(
          (widget.widthInPercentage * mainCanvasWidth) / columnSpace,
        );
      } else if (isMobile && widget.mobileWidthInPercentage) {
        columns = Math.round(
          (widget.mobileWidthInPercentage * mainCanvasWidth) / columnSpace,
        );
      } else if (firstTimeDSLUpdate) {
        // Sets the widthInPercentage & mobileWidthInPercentage value after conversion
        widget.widthInPercentage = (columns * columnSpace) / mainCanvasWidth;
        widget.mobileWidthInPercentage =
          (columns * columnSpace) / mainCanvasWidth;
      }
    }

    // Make sure that the height of the widget that cannot be vertically resized is
    // set to the minimum height after converting from fixed to auto-layout.
    //but should not set for canvas type widgets
    if (
      firstTimeDSLUpdate &&
      isFillWidget &&
      disableResizeHandles?.vertical &&
      minHeight &&
      !checkIsDropTarget(widget.type)
    ) {
      rows = Math.round(minHeight / rowSpace);
    }

    // If the widget's width is less than its min width, then calculate the number of columns based on min width.
    if (minWidth && columns * columnSpace < minWidth) {
      columns = minWidth / columnSpace;
    }

    // If the widget's width is less than its min height, then calculate the number of rows based on min height.
    if (minHeight && rows * rowSpace < minHeight) {
      rows = minHeight / rowSpace;
    }

    // Store the min columns and rows information of each fill widget.
    if (isFillWidget)
      fillChildren.push({
        child,
        columns: (minWidth || 0) / columnSpace,
        rows,
      });

    // Store the columns and rows information of each widget.
    if (child.align === FlexLayerAlignment.Start) {
      startChildren.push({ widget, columns, rows });

      if (!isFillWidget) startColumns += columns;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push({ widget, columns, rows });

      if (!isFillWidget) centerColumns += columns;
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push({ widget, columns, rows });

      if (!isFillWidget) endColumns += columns;
    }
  }

  let availableColumns: number =
    GridDefaults.DEFAULT_GRID_COLUMNS -
    startColumns -
    centerColumns -
    endColumns;
  // Fill widgets are designed to take up parent's entire width on mobile viewport.
  let fillWidgetLength: number = isMobile
    ? GridDefaults.DEFAULT_GRID_COLUMNS
    : Math.min(availableColumns / fillChildren.length, 64);

  // sort fill widgets in descending order of minWidth.
  fillChildren
    .sort((a, b) => b.columns - a.columns)
    .forEach((each, index) => {
      const { child, columns } = each;
      // For mobile viewport, use only fillWidgetLength == 64.
      let width = fillWidgetLength;

      if (!isMobile) {
        // If minWidth > availableColumns / # of fill widgets => assign columns based on minWidth and update fillLength for remaining fill widgets.
        width = columns > fillWidgetLength ? columns : fillWidgetLength;
        availableColumns = Math.max(availableColumns - width, 0);

        if (fillChildren.length - index - 1 > 0)
          fillWidgetLength =
            availableColumns / (fillChildren.length - index - 1);
      }

      if (child.align === FlexLayerAlignment.Start) {
        startColumns += width;
        const index = startChildren.findIndex(
          (each) => each.widget.widgetId === child.id,
        );

        if (index !== -1) startChildren[index].columns = width;
      } else if (child.align === FlexLayerAlignment.Center) {
        centerColumns += width;
        const index = centerChildren.findIndex(
          (each) => each.widget.widgetId === child.id,
        );

        if (index !== -1) centerChildren[index].columns = width;
      } else if (child.align === FlexLayerAlignment.End) {
        endColumns += width;
        const index = endChildren.findIndex(
          (each) => each.widget.widgetId === child.id,
        );

        if (index !== -1) endChildren[index].columns = width;
      }
    });

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

export function getAlignmentSizeInfo(arr: AlignmentInfo[]): {
  startSize: number;
  centerSize: number;
  endSize: number;
} {
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
 * @param isMobile | boolean : Is mobile viewport.
 * @returns { height: number; widgets: CanvasWidgetsReduxState }
 */
function updatePositionsForFlexWrap(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  isMobile: boolean,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };

  const wrappedAlignments: AlignmentInfo[][] = getWrappedAlignmentInfo(arr);

  let top = topRow;
  const rowGap =
    (isMobile ? MOBILE_ROW_GAP : ROW_GAP) /
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

  for (const each of wrappedAlignments) {
    if (!each.length) break;

    const totalColumns = each.reduce((acc, curr) => acc + curr.columns, 0);
    // if there is only one alignment in this row, this implies that it may be wrapped.
    const payload =
      each.length === 1
        ? placeWrappedWidgets(widgets, each[0], top, isMobile, rowGap)
        : placeWidgetsWithoutWrap(widgets, each, top, isMobile);

    widgets = payload.widgets;
    top += payload.height + (totalColumns > 0 ? rowGap : 0);
    continue;
  }

  // adjust the top position to account for the last row
  top -= rowGap;

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
 * @param isMobile | boolean: is mobile viewport.
 * @param rowGap | number: gap between rows.
 * @returns { height: number; widgets: CanvasWidgetsReduxState }
 */
export function placeWrappedWidgets(
  allWidgets: CanvasWidgetsReduxState,
  alignment: AlignmentInfo,
  topRow: number,
  isMobile = false,
  rowGap = 0,
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
      isMobile,
      height,
    );

    widgets = result.widgets;
    startRow += height + rowGap;
  }

  startRow -= rows?.length ? rowGap : 0;

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
  const temp: AlignmentChildren[] = [];
  let columns = 0,
    index = 0,
    maxHeight = 0;

  for (const child of arr.children) {
    const { columns: width, rows: height } = child;

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
    maxHeight = Math.max(maxHeight, height);
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

/**
 * Update sizes and positions of all the canvas containing widgets in the affected flex layer and its parent canvas.
 * Sibling canvases in flex layers are updated to recheck the minSize situations within them.
 * @param allWidgets | CanvasWidgetsReduxState: all widgets.
 * @param parentId | string: parent id.
 * @param layerIndex | number: layer index of the affected flex layer.
 * @param isMobile | boolean: is mobile viewport.
 * @param mainCanvasWidth | number: width of the main canvas.
 * @param firstTimeDSLUpdate | boolean: is this the first time DSL is being updated.
 * @param metaProps | Record<string, any>: meta props of the widget.
 * @returns CanvasWidgetsReduxState
 */
export function updatePositionsOfParentAndSiblings(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  layerIndex: number,
  isMobile: boolean,
  mainCanvasWidth: number,
  firstTimeDSLUpdate = false,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaProps?: Record<string, any>,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];

  if (!parent) return widgets;

  const { children, flexLayers } = parent;

  if (children === undefined || flexLayers === undefined) return widgets;

  // Extract all widgets to be updated. => parent canvas + all other canvas containing widgets in the same flex layer.
  let widgetsToBeParsed: string[] = [parentId];

  if (
    layerIndex > -1 &&
    layerIndex < flexLayers?.length &&
    flexLayers[layerIndex]?.children?.length
  ) {
    flexLayers[layerIndex]?.children.forEach((child: LayerChild) => {
      const widget = widgets[child.id];

      if (!widget || !widget.children || !widget.children?.length) return;

      // Due to canvas / cell splitting, a widget can contain multiple canvases.
      const canvases: string[] = widget.children?.filter(
        (id: string) => widgets[id] && widgets[id].type === "CANVAS_WIDGET",
      );

      if (canvases.length) {
        widgetsToBeParsed = [...widgetsToBeParsed, ...canvases];
      }
    });
  }

  // Update positions of all the widgets.
  for (const widgetId of widgetsToBeParsed) {
    widgets = updateWidgetPositions(
      widgets,
      widgetId,
      isMobile,
      mainCanvasWidth,
      firstTimeDSLUpdate,
      metaProps,
    );
  }

  return widgets;
}
