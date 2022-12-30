import { FlexLayerAlignment, ResponsiveBehavior } from "components/constants";
import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import {
  getBottomRow,
  getLeftColumn,
  getRightColumn,
  getTopRow,
  getWidgetHeight,
  getWidgetWidth,
  setDimensions,
} from "./flexWidgetUtils";

export type Widget = WidgetProps & {
  children?: string[] | undefined;
};

interface AlignmentInfo {
  alignment: FlexLayerAlignment;
  columns: number;
  children: Widget[];
}

/**
 * Calculate widget position on canvas.
 * Logic -
 * 1. If widget contains flexLayers, then update positions for all widgets in layers.
 * 2. Else if widget contains children ( implies fixed canvas), calculate the total height consumed by children.
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
    const parent = widgets[parentId];
    if (!parent) return widgets;

    let height = 0;
    if (parent.flexLayers && parent.flexLayers?.length) {
      for (const layer of parent.flexLayers) {
        const payload: {
          height: number;
          widgets: CanvasWidgetsReduxState;
        } = calculateWidgetPositions(widgets, layer, height, isMobile);
        widgets = payload.widgets;
        height += payload.height;
      }
    } else if (parent.children?.length) {
      let top = 10000,
        bottom = 0;
      for (const childId of parent.children) {
        const child = widgets[childId];
        if (!child) continue;
        const divisor = child.parentRowSpace === 1 ? 10 : 1;
        top = Math.min(top, getTopRow(child, isMobile));
        bottom = Math.max(bottom, getBottomRow(child, isMobile) / divisor);
      }
      height = bottom - top;
    }
    const divisor = parent.parentRowSpace === 1 ? 10 : 1;
    const parentHeight = getWidgetHeight(parent, isMobile) / divisor;
    if (parentHeight <= height) {
      const parentTopRow = getTopRow(parent, isMobile);
      const updatedParent = setDimensions(
        parent,
        parentTopRow,
        (parentTopRow + height + 1) * divisor,
        null,
        null,
        isMobile,
      );
      widgets = { ...widgets, [parent.widgetId]: updatedParent };
    }
    const shouldUpdateHeight =
      parent.parentId &&
      ["CONTAINER_WIDGET", MAIN_CONTAINER_WIDGET_ID].includes(
        allWidgets[parent.parentId].type,
      ) &&
      parentHeight <= height;

    if (shouldUpdateHeight && parent.parentId)
      return updateWidgetPositions(widgets, parent.parentId, isMobile);
    return widgets;
  } catch (e) {
    console.error(e);
    return widgets;
  }
}

function calculateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  topRow: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  const {
    centerChildren,
    centerColumns,
    endChildren,
    endColumns,
    fillWidgetLength,
    startChildren,
    startColumns,
  } = getIndividualAlignmentInfo(allWidgets, layer, isMobile);

  const isFlexWrapped: boolean =
    isMobile &&
    startColumns + centerColumns + endColumns >
      GridDefaults.DEFAULT_GRID_COLUMNS;

  const arr: AlignmentInfo[] = [
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
  ];

  if (isFlexWrapped)
    return updatePositionsForFlexWrap({
      allWidgets,
      topRow,
      arr,
      centerChildren,
      centerColumns,
      endChildren,
      endColumns,
      fillWidgetLength,
      startChildren,
      isMobile,
    });

  return placeWidgetsWithoutWrap(
    allWidgets,
    arr,
    topRow,
    startChildren,
    centerChildren,
    endChildren,
    centerColumns,
    endColumns,
    fillWidgetLength,
    isMobile,
  );
}

// TODO: Preet - abstract this method to use a single function for all usecases.
function placeWidgetsWithoutWrap(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  startChildren: Widget[],
  centerChildren: Widget[],
  endChildren: Widget[],
  centerColumns: number,
  endColumns: number,
  fillWidgetLength: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };
  const { centerSize, endSize, startSize } = getAlignmentSizeInfo(
    arr.sort((a, b) => b.columns - a.columns),
    isMobile,
  );

  let maxHeight = 0;
  const input = [];
  if (startSize) input.push({ children: startChildren, leftColumn: 0 });
  if (centerSize)
    input.push({
      children: centerChildren,
      leftColumn: startSize + centerSize / 2 - centerColumns / 2,
    });
  if (endSize)
    input.push({
      children: endChildren,
      leftColumn: startSize + centerSize + endSize - endColumns,
    });
  input.forEach((each) => {
    let left = each.leftColumn;
    for (const widget of each.children) {
      const height = widget.bottomRow - widget.topRow;
      const width =
        widget.responsiveBehavior === ResponsiveBehavior.Fill
          ? fillWidgetLength
          : getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
      maxHeight = Math.max(maxHeight, height);
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
  });

  return { height: maxHeight, widgets };
}

// TODO: update this function to measure height as well.
function getAlignmentSizes(
  arr: AlignmentInfo[],
  space: number,
  sizes: AlignmentInfo[] = [],
): { alignment: FlexLayerAlignment; columns: number }[] {
  if (arr.length === 0) return sizes;
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

function getIndividualAlignmentInfo(
  widgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  isMobile: boolean,
) {
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
  const fillWidgetLength: number = isMobile
    ? GridDefaults.DEFAULT_GRID_COLUMNS
    : availableColumns / fillChildren.length;
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
    startChildren,
    centerChildren,
    endChildren,
    fillChildren,
    fillWidgetLength,
    startColumns,
    centerColumns,
    endColumns,
  };
}

function getAlignmentSizeInfo(
  arr: AlignmentInfo[],
  isMobile: boolean,
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

function getWrappedAlignmentSize(
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
    if (total + each.columns >= GridDefaults.DEFAULT_GRID_COLUMNS) {
      let x = index;
      if (!res[resIndex].length) {
        res[resIndex].push(each);
        x += 1;
      }
      return getWrappedAlignmentSize([...arr.slice(x)], res, resIndex + 1);
    }
    total += each.columns;
    index += 1;
    res[resIndex].push(each);
  }
  return res;
}

function updatePositionsForFlexWrap(data: {
  allWidgets: CanvasWidgetsReduxState;
  topRow: number;
  arr: AlignmentInfo[];
  centerChildren: Widget[];
  centerColumns: number;
  endChildren: Widget[];
  endColumns: number;
  fillWidgetLength: number;
  startChildren: Widget[];
  isMobile: boolean;
}): { height: number; widgets: CanvasWidgetsReduxState } {
  const {
    allWidgets,
    arr,
    centerChildren,
    centerColumns,
    endChildren,
    endColumns,
    fillWidgetLength,
    isMobile,
    startChildren,
    topRow,
  } = data;
  let widgets = { ...allWidgets };

  /**
   * Find the order in which the alignments are wrapped.
   * if res.length === 1 => no wrapping.
   * else for each row, fit in widgets in GridDefaults.DEFAULT_GRID_COLUMNS columns
   */
  const wrappedAlignments: AlignmentInfo[][] = getWrappedAlignmentSize(arr);

  let top = topRow;
  for (const each of wrappedAlignments) {
    if (!each.length) break;
    const payload =
      each.length === 1
        ? placeWrappedWidgets(widgets, each, top, fillWidgetLength, isMobile)
        : placeWidgetsWithoutWrap(
            widgets,
            each,
            top,
            startChildren,
            centerChildren,
            endChildren,
            centerColumns,
            endColumns,
            fillWidgetLength,
            isMobile,
          );
    widgets = payload.widgets;
    top += payload.height;
    continue;
  }
  return { height: top - topRow, widgets };
}

function getStartingPosition(
  alignment: FlexLayerAlignment,
  startSize: number,
  centerSize: number,
  endSize: number,
  centerColumns: number,
  endColumns: number,
): number {
  if (alignment === FlexLayerAlignment.Start) {
    return 0;
  } else if (alignment === FlexLayerAlignment.Center) {
    return startSize + centerSize / 2 - centerColumns / 2;
  } else if (alignment === FlexLayerAlignment.End) {
    return startSize + centerSize + endSize - endColumns;
  }
  return 0;
}

function placeWrappedWidgets(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  fillWidgetLength: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };
  /**
   * arr could contain multiple alignments.
   * More rows are needed only if it contains a single alignment,
   *  and it needs more than GridDefaults.DEFAULT_GRID_COLUMNS columns.
   */
  let startRow = topRow;
  if (arr.length === 1) {
    // wrapped alignment
    const rows: Row[] = getWrappedRows(arr[0], [], isMobile);
    for (const row of rows) {
      const { alignment, children, columns, height } = row;
      const { centerSize, endSize, startSize } = getAlignmentSizeInfo(
        [{ alignment, children, columns }],
        isMobile,
      );
      let left: number = getStartingPosition(
        alignment,
        startSize,
        centerSize,
        endSize,
        alignment === FlexLayerAlignment.Center ? columns : 0,
        alignment === FlexLayerAlignment.End ? columns : 0,
      );
      for (const child of children) {
        const height = getWidgetHeight(child, isMobile);
        const width =
          child.responsiveBehavior === ResponsiveBehavior.Fill
            ? fillWidgetLength
            : getWidgetWidth(child, isMobile);
        const updatedWidget = setDimensions(
          child,
          startRow,
          startRow + height,
          left,
          left + width,
          isMobile,
        );
        widgets = {
          ...widgets,
          [child.widgetId]: {
            ...updatedWidget,
          },
        };
        left += width;
      }
      startRow += height;
    }
  }
  return { height: startRow - topRow, widgets };
}

interface Row {
  alignment: FlexLayerAlignment;
  children: Widget[];
  columns: number;
  height: number;
}

function getWrappedRows(
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

// function updateHeight(
//   allWidgets: CanvasWidgetsReduxState,
//   widgetId: string,
//   height: number,
//   isMobile,
// ): void {
//   const widgets = { ...allWidgets };
//   const widget = widgets[widgetId];
//   const children = widget.children;
//   if (!children || !children?.length) return widgets;
//   let maxHeight = 0;
//   for (const child of children) {
//     const childHeight = getWidgetHeight(child, isMobile);
//     if (childHeight > maxHeight) maxHeight = childHeight;
//   }
// }
