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
      } = calculateWidgetPositions(widgets, layer, height);
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
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };

  const startChildren = [],
    centerChildren = [],
    endChildren = [],
    fillChildren = [];
  let startColumns = 0,
    centerColumns = 0,
    endColumns = 0;
  let startSize = 0,
    centerSize = 0,
    endSize = 0;

  // Calculate the number of columns occupied by hug widgets in each alignment.
  for (const child of layer.children) {
    const widget = widgets[child.id];
    const isFillWidget = widget.responsiveBehavior === ResponsiveBehavior.Fill;
    if (isFillWidget) fillChildren.push(child);
    if (child.align === FlexLayerAlignment.Start) {
      startChildren.push(widget);
      if (!isFillWidget) startColumns += widget.rightColumn - widget.leftColumn;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
      if (!isFillWidget)
        centerColumns += widget.rightColumn - widget.leftColumn;
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      if (!isFillWidget) endColumns += widget.rightColumn - widget.leftColumn;
    }
  }

  const availableColumns = 64 - startColumns - centerColumns - endColumns;
  const fillWidgetLength = availableColumns / fillChildren.length;
  for (const child of fillChildren) {
    if (child.align === FlexLayerAlignment.Start) {
      startColumns += fillWidgetLength;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerColumns += fillWidgetLength;
    } else if (child.align === FlexLayerAlignment.End) {
      endColumns += fillWidgetLength;
    }
  }

  const arr: { alignment: FlexLayerAlignment; columns: number }[] = [
    { alignment: FlexLayerAlignment.Start, columns: startColumns },
    { alignment: FlexLayerAlignment.Center, columns: centerColumns },
    { alignment: FlexLayerAlignment.End, columns: endColumns },
  ].sort((a, b) => b.columns - a.columns);

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
          : widget.rightColumn - widget.leftColumn;
      maxHeight = Math.max(maxHeight, height);
      widgets = {
        ...widgets,
        [widget.widgetId]: {
          ...widget,
          leftColumn: left,
          rightColumn: left + width,
          topRow,
          bottomRow: topRow + height,
        },
      };
      left += width;
    }
  });

  return { height: maxHeight, widgets };
}

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
