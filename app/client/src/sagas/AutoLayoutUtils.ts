import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "components/constants";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { FLEXBOX_PADDING } from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";

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
  isMobile?: boolean,
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
  const updatedWidgets = updateWidgetPositions(
    widgets,
    canvas.widgetId,
    isMobile,
  );
  return updatedWidgets;
}

export function* updateFlexLayersOnDelete(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  parentId: string,
  isMobile?: boolean,
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
  return updateWidgetPositions(widgets, parentId, isMobile);
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

  const columnsPerFillChild = (64 - hugChildrenColumns) / fillChildren.length;

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
      widget.mobileLeftColumn = 0;
    } else if (
      widget.responsiveBehavior === ResponsiveBehavior.Hug &&
      widget.minWidth
    ) {
      const { minWidth, rightColumn } = widget;
      const columnSpace = (canvasWidth - FLEXBOX_PADDING * 2) / 64;
      if (columnSpace * rightColumn < minWidth) {
        widget.mobileLeftColumn = 0;
        widget.mobileRightColumn = Math.min(minWidth / columnSpace, 64);
      }
    }
    widget.mobileTopRow = widget.topRow;
    widget.mobileBottomRow = widget.bottomRow;
    widgets = alterLayoutForMobile(
      widgets,
      child,
      (canvasWidth * (widget.mobileRightColumn || 1)) / 64,
    );
    widgets[child] = widget;
    widgets = updateWidgetPositions(widgets, child, true);
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

  widgets = updateWidgetPositions(widgets, parentId, false);
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
