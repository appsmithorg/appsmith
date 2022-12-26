import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "components/constants";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

function getCanvas(widgets: CanvasWidgetsReduxState, containerId: string) {
  const container = widgets[containerId];
  if (!container) return;
  let canvas;
  // True for MainContainer
  if (container.type === "CANVAS_WIDGET") canvas = container;
  else {
    const canvasId = container.children ? container.children[0] : "";
    canvas = widgets[canvasId];
  }
  if (!canvas) return;
  return canvas;
}

export function removeChildLayers(
  allWidgets: CanvasWidgetsReduxState,
  containerId: string,
): CanvasWidgetsReduxState {
  const widgets = { ...allWidgets };
  let canvas = getCanvas(widgets, containerId);
  if (!canvas) return widgets;
  canvas = { ...canvas, flexLayers: [] };
  widgets[canvas.widgetId] = canvas;
  return widgets;
}

export function* wrapChildren(
  allWidgets: CanvasWidgetsReduxState,
  containerId: string,
) {
  const widgets = { ...allWidgets };
  let canvas = getCanvas(widgets, containerId);
  if (!canvas) return widgets;

  const children = canvas.children || [];
  if (!children.length) return widgets;

  const flexLayers: FlexLayer[] = [];

  for (const each of children) {
    const child = widgets[each];
    if (!child) continue;
    flexLayers.push({
      children: [{ id: child.widgetId, align: FlexLayerAlignment.Start }],
      hasFillChild:
        child.responsiveBehavior === ResponsiveBehavior.Fill || false,
    });
  }
  canvas = { ...canvas, flexLayers };
  widgets[canvas.widgetId] = canvas;
  // update size
  const updatedWidgets = updateSizeOfAllChildren(widgets, canvas.widgetId);
  return updatedWidgets;
}

export function* updateFlexLayersOnDelete(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  parentId: string,
) {
  const widgets = { ...allWidgets };
  let parent = widgets[parentId];
  if (!parent) return widgets;

  let flexLayers = [...(parent.flexLayers || [])];
  if (!flexLayers.length) return widgets;
  let layerIndex = -1; // Find the layer in which the deleted widget exists.
  let updatedChildren: LayerChild[] = [];
  for (const layer of flexLayers) {
    layerIndex += 1;
    const children = layer.children || [];
    if (!children.length) continue;
    const index = children.findIndex(
      (each: LayerChild) => each.id === widgetId,
    );
    if (index === -1) continue;
    // children.splice(index, 1);
    updatedChildren = children.filter(
      (each: LayerChild) => each.id !== widgetId,
    );
    break;
  }

  flexLayers = [
    ...flexLayers.slice(0, layerIndex),
    {
      children: updatedChildren,
      hasFillChild: updatedChildren.some(
        (each: LayerChild) =>
          widgets[each.id] &&
          widgets[each.id]?.responsiveBehavior === ResponsiveBehavior.Fill,
      ),
    },
    ...flexLayers.slice(layerIndex + 1),
  ];

  parent = {
    ...parent,
    flexLayers: flexLayers.filter(
      (layer: FlexLayer) => layer?.children?.length,
    ),
  };
  widgets[parentId] = parent;

  if (layerIndex === -1) return widgets;
  return updateFlexChildColumns(widgets, layerIndex, parentId);
}
// TODO: refactor these implementations
export function updateFillChildStatus(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  fill: boolean,
) {
  const widgets = { ...allWidgets };
  const widget = widgets[widgetId];
  if (!widget || !widget.parentId) return widgets;
  let canvas = getCanvas(widgets, widget.parentId);
  if (!canvas) return widgets;

  const flexLayers: FlexLayer[] = canvas.flexLayers || [];
  let layerIndex = -1;
  if (!flexLayers.length) return widgets;

  const updatedLayers = flexLayers?.map((layer, index: number) => {
    const children = layer.children || [];
    const selectedWidgetIndex: number = children.findIndex(
      (each: LayerChild) => each.id === widgetId,
    );
    if (selectedWidgetIndex === -1) return layer;
    layerIndex = index;
    return {
      ...layer,
      hasFillChild: children.reduce((acc, each, index) => {
        const widget = widgets[each.id];
        if (index === selectedWidgetIndex) return acc || fill;
        return acc || widget?.responsiveBehavior === ResponsiveBehavior.Fill;
      }, false),
    };
  });

  canvas = {
    ...canvas,
    flexLayers: updatedLayers,
  };
  widgets[canvas.widgetId] = canvas;

  if (layerIndex === -1) return widgets;
  return updateFlexChildColumns(widgets, layerIndex, canvas.widgetId);
}

export function updateFlexChildColumns(
  allWidgets: CanvasWidgetsReduxState,
  layerIndex: number,
  parentId: string,
): CanvasWidgetsReduxState {
  const widgets = Object.assign({}, allWidgets);
  const canvas = widgets[parentId];
  const children = canvas.children;
  if (!children || !children.length) return widgets;

  const layer = canvas.flexLayers[layerIndex];
  if (!layer || !layer?.children?.length || !layer.hasFillChild) return widgets;

  const fillChildren: any[] = [];
  const hugChildrenColumns = layer?.children?.reduce(
    (acc: number, child: LayerChild) => {
      const widget = widgets[child.id];
      if (widget.responsiveBehavior === ResponsiveBehavior.Fill) {
        fillChildren.push(widget);
        return acc;
      }
      return (
        acc +
        (widget.columns
          ? widget.columns
          : widget.rightColumn - widget.leftColumn)
      );
    },
    0,
  );
  if (!fillChildren.length) return widgets;

  const columnsPerFillChild = Math.floor(
    (64 - hugChildrenColumns) / fillChildren.length,
  );

  for (const child of fillChildren) {
    widgets[child.widgetId] = {
      ...child,
      rightColumn: child.leftColumn + columnsPerFillChild,
    };
  }
  return widgets;
}

export function updateChildrenSize(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  widgetId: string,
): CanvasWidgetsReduxState {
  const widgets = Object.assign({}, allWidgets);
  const parent = widgets[parentId];
  if (!parent || !parent?.flexLayers || !parent?.flexLayers?.length)
    return widgets;

  const layerIndex = parent.flexLayers.reduce(
    (acc: number, layer: FlexLayer, index: number) => {
      if (layer.children.some((child: LayerChild) => child.id === widgetId)) {
        return index;
      }
      return acc;
    },
    -1,
  );

  return updateFlexChildColumns(widgets, layerIndex, parentId);
}

export function updateSizeOfAllChildren(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
): CanvasWidgetsReduxState {
  let widgets = Object.assign({}, allWidgets);
  const parent = widgets[parentId];

  if (!parent || !parent?.flexLayers || !parent?.flexLayers?.length)
    return widgets;

  for (let i = 0; i < parent.flexLayers.length; i++) {
    widgets = updateFlexChildColumns(widgets, i, parentId);
  }

  return widgets;
}

export function alterLayoutForMobile(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  canvasWidth: number,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  const children = parent.children;

  if (checkIsNotVerticalStack(parent) && parent.widgetId !== "0") {
    return widgets;
  }
  if (!children || !children.length) return widgets;

  for (const child of children) {
    const widget = { ...widgets[child] };

    if (widget.responsiveBehavior === ResponsiveBehavior.Fill) {
      widget.mobileRightColumn = 64;
      widget.leftColumn = 0;
    } else if (
      widget.responsiveBehavior === ResponsiveBehavior.Hug &&
      widget.minWidth
    ) {
      const { minWidth, rightColumn } = widget;
      const columnSpace = canvasWidth / 64;
      if (columnSpace * rightColumn < minWidth) {
        widget.leftColumn = 0;
        widget.mobileRightColumn = Math.min(
          Math.floor(minWidth / columnSpace),
          64,
        );
      }
    }

    widgets = alterLayoutForMobile(
      widgets,
      child,
      (canvasWidth * (widget.mobileRightColumn || 1)) / 64,
    );
    widgets[child] = widget;
  }
  return widgets;
}

export function alterLayoutForDesktop(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  const children = parent.children;

  if (checkIsNotVerticalStack(parent) && parent.widgetId !== "0")
    return widgets;
  if (!children || !children.length) return widgets;

  widgets = updateSizeOfAllChildren(widgets, parentId);
  for (const child of children) {
    widgets = alterLayoutForDesktop(widgets, child);
  }

  return widgets;
}

function checkIsNotVerticalStack(widget: any): boolean {
  return (
    widget.positioning !== undefined &&
    widget.positioning !== Positioning.Vertical
  );
}

/**
 * Calculate widget position on canvas.
 */
export function updateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
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
    endChildren = [];
  let startColumns = 0,
    centerColumns = 0,
    endColumns = 0;
  let startSize = 0,
    centerSize = 0,
    endSize = 0;
  // Calculate the number of columns occupied by each alignment.
  for (const child of layer.children) {
    const widget = widgets[child.id];
    if (child.align === FlexLayerAlignment.Start) {
      startChildren.push(widget);
      startColumns += widget.rightColumn - widget.leftColumn;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
      centerColumns += widget.rightColumn - widget.leftColumn;
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      endColumns += widget.rightColumn - widget.leftColumn;
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
  // Calculate positions for start aligned children.
  let rightColumn = 0;
  for (const widget of startChildren) {
    const height = widget.bottomRow - widget.topRow;
    const width = widget.rightColumn - widget.leftColumn;
    maxHeight = Math.max(maxHeight, height);
    widgets = {
      ...widgets,
      [widget.widgetId]: {
        ...widget,
        leftColumn: rightColumn,
        rightColumn: rightColumn + width,
        topRow,
        bottomRow: topRow + height,
      },
    };
    rightColumn = widget.rightColumn;
  }

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
      const width = widget.rightColumn - widget.leftColumn;
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
