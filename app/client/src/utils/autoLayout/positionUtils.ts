import { FlexLayerAlignment, ResponsiveBehavior } from "components/constants";
import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

/**
 * Calculate widget position on canvas.
 */
export function updateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  isMobile?: boolean,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  try {
    const parent = widgets[parentId];
    if (!parent || !parent.flexLayers || !parent.flexLayers?.length)
      return widgets;

    let height = 0;
    for (const layer of parent.flexLayers) {
      const payload: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = calculateWidgetPositions(widgets, layer, height, isMobile);
      widgets = payload.widgets;
      height += payload.height;
    }
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
  let widgets = { ...allWidgets };

  const {
    centerChildren,
    centerColumns,
    endChildren,
    endColumns,
    fillWidgetLength,
    startChildren,
    startColumns,
  } = getIndividualAlignmentInfo(widgets, layer, isMobile);

  const isFlexWrapped: boolean =
    isMobile && startColumns + centerColumns + endColumns > 64;

  const arr: { alignment: FlexLayerAlignment; columns: number }[] = [
    { alignment: FlexLayerAlignment.Start, columns: startColumns },
    { alignment: FlexLayerAlignment.Center, columns: centerColumns },
    { alignment: FlexLayerAlignment.End, columns: endColumns },
  ];

  const { centerSize, endSize, startSize } = getAlignmentSizeInfo(
    arr.sort((a, b) => b.columns - a.columns),
    isMobile,
  );

  let maxHeight = 0;
  [
    { children: startChildren, leftColumn: 0 },
    {
      children: centerChildren,
      leftColumn: startSize + centerSize / 2 - centerColumns / 2,
    },
    {
      children: endChildren,
      leftColumn: startSize + centerSize + endSize - endColumns,
    },
  ].forEach((each) => {
    let left = each.leftColumn;
    for (const widget of each.children) {
      const height = widget.bottomRow - widget.topRow;
      const width =
        widget.responsiveBehavior === ResponsiveBehavior.Fill
          ? fillWidgetLength
          : getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
      maxHeight = Math.max(maxHeight, height);
      const widgetAfterLeftUpdate = setLeftColumn(widget, left, isMobile);
      const widgetAfterRightUpdate = setRightColumn(
        widgetAfterLeftUpdate,
        left + width,
        isMobile,
      );
      widgets = {
        ...widgets,
        [widget.widgetId]: {
          ...widgetAfterRightUpdate,
          topRow,
          bottomRow: topRow + height,
        },
      };
      left += width;
    }
  });

  return { height: maxHeight, widgets };
}

// TODO: update this function to measure height as well.
function getAlignmentSizes(
  arr: { alignment: FlexLayerAlignment; columns: number }[],
  space: number,
  sizes: { alignment: FlexLayerAlignment; columns: number }[] = [],
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
      if (!isFillWidget)
        startColumns +=
          getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
      if (!isFillWidget)
        centerColumns +=
          getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      if (!isFillWidget)
        endColumns +=
          getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
    }
  }

  const availableColumns: number =
    64 - startColumns - centerColumns - endColumns;
  const fillWidgetLength: number = isMobile
    ? 64
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
  arr: { alignment: FlexLayerAlignment; columns: number }[],
  isMobile: boolean,
): { startSize: number; centerSize: number; endSize: number } {
  let startSize = 0,
    centerSize = 0,
    endSize = 0;
  const sizes: {
    alignment: FlexLayerAlignment;
    columns: number;
  }[] = getAlignmentSizes(arr, 64, []);

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
  arr: { alignment: FlexLayerAlignment; columns: number }[],
  res: { alignment: FlexLayerAlignment; columns: number }[][] = [[], [], []],
  resIndex = 0,
): { alignment: FlexLayerAlignment; columns: number }[][] {
  if (arr.length === 1) {
    res[resIndex].push(arr[0]);
    return res;
  }
  let index = 0;
  let total = 0;
  for (const each of arr) {
    if (total + each.columns >= 64) {
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

function getRightColumn(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileRightColumn !== undefined
    ? widget.mobileRightColumn
    : widget.rightColumn;
}

function setRightColumn(widget: any, val: number, isMobile: boolean): any {
  return isMobile && widget.mobileRightColumn !== undefined
    ? { ...widget, mobileRightColumn: val }
    : { ...widget, rightColumn: val };
}

function getLeftColumn(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileLeftColumn !== undefined
    ? widget.mobileLeftColumn
    : widget.leftColumn;
}

function setLeftColumn(widget: any, val: number, isMobile: boolean): any {
  return isMobile && widget.mobileLeftColumn !== undefined
    ? { ...widget, mobileLeftColumn: val }
    : { ...widget, leftColumn: val };
}
