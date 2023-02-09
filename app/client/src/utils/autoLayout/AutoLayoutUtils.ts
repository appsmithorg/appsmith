import { FlexLayer, LayerChild } from "./autoLayoutTypes";
import {
  FLEXBOX_PADDING,
  layoutConfigurations,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  defaultAutoLayoutWidgets,
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { getWidgetWidth } from "./flexWidgetUtils";
import { AlignmentColumnInfo } from "./autoLayoutTypes";

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
  isMobile: boolean,
  mainCanvasWidth: number,
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
    mainCanvasWidth,
  );
  return updatedWidgets;
}

export function updateFlexLayersOnDelete(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  parentId: string,
  isMobile: boolean,
  mainCanvasWidth: number,
): CanvasWidgetsReduxState {
  const widgets = { ...allWidgets };
  if (
    widgets[MAIN_CONTAINER_WIDGET_ID].appPositioningType ===
      AppPositioningTypes.FIXED ||
    widgets[MAIN_CONTAINER_WIDGET_ID].positioning === Positioning.Fixed
  )
    return widgets;
  let parent = widgets[parentId];
  if (!parent) return widgets;

  let flexLayers = [...(parent.flexLayers || [])];
  if (!flexLayers.length) return widgets;
  let layerIndex = -1; // Find the layer in which the deleted widget exists.
  let index = 0;
  let updatedChildren: LayerChild[] = [];
  for (const layer of flexLayers) {
    const children = layer.children || [];
    if (!children.length) continue;
    const childIndex = children.findIndex(
      (each: LayerChild) => each.id === widgetId,
    );
    if (childIndex === -1) {
      index += 1;
      continue;
    }

    updatedChildren = children.filter(
      (each: LayerChild) => each.id !== widgetId,
    );
    layerIndex = index;
    break;
  }
  if (layerIndex === -1) return widgets;

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

  return updateWidgetPositions(widgets, parentId, isMobile, mainCanvasWidth);
}

export function updateFillChildStatus(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  fill: boolean,
  isMobile: boolean,
  mainCanvasWidth: number,
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

  return updateWidgetPositions(
    widgets,
    canvas.widgetId,
    isMobile,
    mainCanvasWidth,
  );
}

// export function alterLayoutForMobile(
//   allWidgets: CanvasWidgetsReduxState,
//   parentId: string,
//   canvasWidth: number,
//   mainCanvasWidth: number,
// ): CanvasWidgetsReduxState {
//   let widgets = { ...allWidgets };
//   const parent = widgets[parentId];
//   const children = parent.children;

//   if (!isStack(allWidgets, parent)) {
//     return widgets;
//   }
//   if (!children || !children.length) return widgets;

//   for (const child of children) {
//     const widget = { ...widgets[child] };
//     const minWidth: number | undefined = getMinPixelWidth(
//       widget,
//       mainCanvasWidth,
//     );

//     if (widget.responsiveBehavior === ResponsiveBehavior.Fill) {
//       widget.mobileRightColumn = 64;
//       widget.mobileLeftColumn = 0;
//     } else if (
//       widget.responsiveBehavior === ResponsiveBehavior.Hug &&
//       minWidth
//     ) {
//       const { leftColumn, rightColumn } = widget;
//       const columnSpace = (canvasWidth - FLEXBOX_PADDING * 2) / 64;
//       if (columnSpace * (rightColumn - leftColumn) < minWidth) {
//         /**
//          * Set a proper width for the widget => left column = 0;
//          * Actual positioning of the widget will be updated by updateWidgetPositions function.
//          */
//         widget.mobileLeftColumn = 0;
//         widget.mobileRightColumn = Math.min(minWidth / columnSpace, 64);
//       }
//     } else {
//       widget.mobileLeftColumn = widget.leftColumn;
//       widget.mobileRightColumn = widget.rightColumn;
//     }

//     widget.mobileTopRow = widget.topRow;
//     widget.mobileBottomRow = widget.bottomRow;
//     if (widget.mobileRightColumn !== undefined)
//       widgets = alterLayoutForMobile(
//         widgets,
//         child,
//         (canvasWidth * widget.mobileRightColumn) / 64,
//         mainCanvasWidth,
//       );
//     widgets[child] = widget;
//     widgets = updateWidgetPositions(widgets, child, true, mainCanvasWidth);
//   }
//   widgets = updateWidgetPositions(widgets, parentId, true, mainCanvasWidth);
//   return widgets;
// }

export function alterLayoutForMobile(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  canvasWidth: number,
  mainCanvasWidth: number,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  const children = parent.children;

  if (!isStack(allWidgets, parent)) {
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
      mainCanvasWidth,
    );
    widgets[child] = widget;
    widgets = updateWidgetPositions(widgets, child, true, mainCanvasWidth);
  }
  widgets = updateWidgetPositions(widgets, parentId, true, mainCanvasWidth);
  return widgets;
}

export function alterLayoutForDesktop(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  mainCanvasWidth: number,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  const children = parent.children;

  if (!isStack(allWidgets, parent)) return widgets;
  if (!children || !children.length) return widgets;

  widgets = updateWidgetPositions(widgets, parentId, false, mainCanvasWidth);
  for (const child of children) {
    widgets = alterLayoutForDesktop(widgets, child, mainCanvasWidth);
  }
  return widgets;
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
  mainCanvasWidth: number,
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
  return updateWidgetPositions(widgets, parentId, isMobile, mainCanvasWidth);
}

/**
 * Add nested children to flex layers of the new pasted canvas.
 * The flexLayers get copied from the original canvas.
 * This method matches the copied widgetId with the original widgetId
 * and replaces them in position.
 */
export function addChildToPastedFlexLayers(
  allWidgets: CanvasWidgetsReduxState,
  widget: any,
  widgetIdMap: Record<string, string>,
  isMobile: boolean,
  mainCanvasWidth: number,
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
        }
        childIndex += 1;
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
  return updateWidgetPositions(
    widgets,
    parent.widgetId,
    isMobile,
    mainCanvasWidth,
  );
}

export function isStack(
  allWidgets: CanvasWidgetsReduxState,
  widget: any,
): boolean {
  let parent = widget.parentId ? allWidgets[widget.parentId] : undefined;
  if (parent && parent.type === "CANVAS_WIDGET" && parent.parentId)
    parent = allWidgets[parent.parentId];
  return (
    widget.positioning === Positioning.Vertical ||
    ((parent && defaultAutoLayoutWidgets.includes(parent.type)) ||
    parent?.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? allWidgets[MAIN_CONTAINER_WIDGET_ID].positioning ===
        Positioning.Vertical
      : false)
  );
}

/**
 * END: copy paste utils
 */

export function getLayerIndexOfWidget(
  flexLayers: FlexLayer[],
  widgetId: string,
): number {
  if (!flexLayers) return -1;
  return flexLayers.findIndex((layer: FlexLayer) => {
    return (
      layer.children.findIndex((child: LayerChild) => child.id === widgetId) !==
      -1
    );
  });
}

export function getViewportClassName(viewportWidth: number) {
  if (viewportWidth > layoutConfigurations.MOBILE.maxWidth) {
    return "desktop-view";
  } else {
    return "mobile-view";
  }
}

export function getFillWidgetLengthForLayer(
  layer: any,
  allWidgets: any,
): number | undefined {
  let fillLength = GridDefaults.DEFAULT_GRID_COLUMNS;
  let hugLength = 0,
    fillCount = 0;
  for (const child of layer.children) {
    const childWidget = allWidgets[child.id];
    if (!childWidget) {
      continue;
    }
    if (childWidget.responsiveBehavior !== ResponsiveBehavior.Fill) {
      hugLength += childWidget.rightColumn - childWidget.leftColumn;
    } else {
      fillCount += 1;
    }
  }
  fillLength = (fillLength - hugLength) / (fillCount || 1);
  return fillLength;
}

export function getAlignmentColumnInfo(
  widgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  isMobile: boolean,
): AlignmentColumnInfo {
  if (!layer)
    return {
      [FlexLayerAlignment.Start]: 0,
      [FlexLayerAlignment.Center]: 0,
      [FlexLayerAlignment.End]: 0,
    };
  let start = 0,
    end = 0,
    center = 0;
  for (const child of layer.children) {
    const widget = widgets[child.id];
    if (!widget) continue;
    if (child.align === FlexLayerAlignment.End)
      end += getWidgetWidth(widget, isMobile);
    else if (child.align === FlexLayerAlignment.Center)
      center += getWidgetWidth(widget, isMobile);
    else start += getWidgetWidth(widget, isMobile);
  }
  return {
    [FlexLayerAlignment.Start]: start,
    [FlexLayerAlignment.Center]: center,
    [FlexLayerAlignment.End]: end,
  };
}
