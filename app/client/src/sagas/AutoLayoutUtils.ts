import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "components/constants";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  FLEXBOX_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
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

export function updateFlexLayersOnDelete(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  parentId: string,
  isMobile?: boolean,
): CanvasWidgetsReduxState {
  const widgets = { ...allWidgets };
  if (
    widgets[MAIN_CONTAINER_WIDGET_ID].appPositioningType ===
    AppPositioningTypes.FIXED
  )
    return widgets;
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

export function updateFillChildStatus(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  fill: boolean,
  isMobile: boolean,
) {
  let widgets = { ...allWidgets };
  const widget = widgets[widgetId];
  if (!widget || !widget.parentId) return widgets;
  const canvas = getCanvas(widgets, widget.parentId);
  if (!canvas) return widgets;

  const flexLayers: FlexLayer[] = canvas.flexLayers || [];
  if (!flexLayers.length) return widgets;
  widgets = {
    ...widgets,
    [widgetId]: {
      ...widget,
      ResponsiveBehavior: fill
        ? ResponsiveBehavior.Fill
        : ResponsiveBehavior.Hug,
    },
  };

  return updateWidgetPositions(widgets, canvas.widgetId, isMobile);
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
  widgets = updateWidgetPositions(widgets, parentId, true);
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

/**
 * START: COPY PASTE UTILS
 */

export function pasteWidgetInFlexLayers(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  widget: any,
  originalWidgetId: string,
  isMobile: boolean,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  let flexLayers: FlexLayer[] = parent.flexLayers || [];
  /**
   * If the new parent is not the same as the original parent,
   * then add a new flex layer.
   */
  if (
    !widgets[originalWidgetId] ||
    widgets[originalWidgetId].parentId !== parentId
  ) {
    flexLayers = [
      ...flexLayers,
      {
        children: [
          {
            id: widget.widgetId,
            align: FlexLayerAlignment.Start,
          },
        ],
      },
    ];
  } else {
    /**
     * If the new parent is the same as the original parent,
     * then update the flex layer.
     */
    let rowIndex = -1,
      alignment = FlexLayerAlignment.Start;
    const flexLayerIndex = flexLayers.findIndex((layer: FlexLayer) => {
      const temp = layer.children.findIndex(
        (child: LayerChild) => child.id === originalWidgetId,
      );
      if (temp > -1) {
        rowIndex = temp;
        alignment = layer.children[temp].align;
      }
      return temp > -1;
    });
    if (flexLayerIndex > -1 && rowIndex > -1) {
      let selectedLayer = flexLayers[flexLayerIndex];
      selectedLayer = {
        children: [
          ...selectedLayer.children.slice(0, rowIndex + 1),
          { id: widget.widgetId, align: alignment },
          ...selectedLayer.children.slice(rowIndex + 1),
        ],
      };
      flexLayers = [
        ...flexLayers.slice(0, flexLayerIndex),
        selectedLayer,
        ...flexLayers.slice(flexLayerIndex + 1),
      ];
    }
  }
  widgets = {
    ...widgets,
    [parentId]: {
      ...parent,
      flexLayers,
    },
  };
  return updateWidgetPositions(widgets, parentId, isMobile);
}

export function addChildToPastedFlexLayers(
  allWidgets: CanvasWidgetsReduxState,
  widget: any,
  widgetIdMap: Record<string, string>,
  isMobile: boolean,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[widget.parentId];
  const flexLayers = parent.flexLayers || [];
  if (flexLayers.length > 0) {
    let index = 0;
    for (const layer of flexLayers) {
      let children = layer.children;
      let childIndex = 0;
      for (const child of children) {
        if (widgetIdMap[child.id] === widget.widgetId) {
          children = [
            ...children.slice(0, childIndex),
            { id: widget.widgetId, align: child.align },
            ...children.slice(childIndex + 1),
          ];
          childIndex += 1;
        }
      }
      flexLayers[index] = {
        children,
      };
      index += 1;
    }
  }
  widgets = {
    ...widgets,
    [parent.widgetId]: {
      ...parent,
      flexLayers,
    },
  };
  return updateWidgetPositions(widgets, parent.widgetId, isMobile);
}

export function isStack(
  allWidgets: CanvasWidgetsReduxState,
  widget: any,
): boolean {
  const parent = widget.parentId ? allWidgets[widget.parentId] : undefined;
  return (
    widget.positioning === Positioning.Vertical ||
    (parent && ["CONTAINER_WIDGET", "CANVAS_WIDGET"].includes(parent.type)
      ? allWidgets[MAIN_CONTAINER_WIDGET_ID].appPositioningType ===
        AppPositioningTypes.AUTO
      : false)
  );
}

/**
 * END: copy paste utils
 */
