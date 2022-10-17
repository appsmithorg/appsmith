import { FlexLayerAlignment, ResponsiveBehavior } from "components/constants";
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
  return widgets;
}

export function* updateFlexLayersOnDelete(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  parentId: string,
) {
  const widgets = { ...allWidgets };
  let parent = widgets[parentId];
  if (!parent) return widgets;

  const flexLayers = parent.flexLayers || [];
  if (!flexLayers.length) return widgets;
  for (const layer of flexLayers) {
    const children = layer.children || [];
    if (!children.length) continue;
    const index = children.findIndex(
      (each: LayerChild) => each.id === widgetId,
    );
    if (index === -1) continue;
    children.splice(index, 1);
    layer.children = children;
  }
  parent = {
    ...parent,
    flexLayers: flexLayers.filter(
      (layer: FlexLayer) => layer?.children?.length,
    ),
  };
  widgets[parentId] = parent;
  return widgets;
}

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
  if (!flexLayers.length) return widgets;

  const updatedLayers = flexLayers?.map((layer) => {
    const children = layer.children || [];
    const selectedWidgetIndex: number = children.findIndex(
      (each: LayerChild) => each.id === widgetId,
    );
    if (selectedWidgetIndex === -1) return layer;
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
  return widgets;
}
