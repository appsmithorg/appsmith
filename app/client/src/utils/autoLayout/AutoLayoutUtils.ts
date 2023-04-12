import type { FlexLayer, LayerChild } from "./autoLayoutTypes";
import {
  FLEXBOX_PADDING,
  layoutConfigurations,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
  CONTAINER_GRID_PADDING,
  DefaultDimensionMap,
} from "constants/WidgetConstants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  defaultAutoLayoutWidgets,
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import {
  updatePositionsOfParentAndSiblings,
  updateWidgetPositions,
} from "utils/autoLayout/positionUtils";
import type { AlignmentColumnInfo } from "./autoLayoutTypes";
import {
  getWidgetMinMaxDimensionsInPixel,
  getWidgetWidth,
} from "./flexWidgetUtils";
import type { DSLWidget } from "widgets/constants";

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

  return updatePositionsOfParentAndSiblings(
    widgets,
    parentId,
    layerIndex,
    isMobile,
    mainCanvasWidth,
  );
}

export function alterLayoutForMobile(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  canvasWidth: number,
  mainCanvasWidth: number,
  firstTimeDSLUpdate = false,
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
    const { minWidth } = getWidgetMinMaxDimensionsInPixel(
      widget,
      mainCanvasWidth,
    );
    if (widget.responsiveBehavior === ResponsiveBehavior.Fill) {
      widget.mobileRightColumn = GridDefaults.DEFAULT_GRID_COLUMNS;
      widget.mobileLeftColumn = 0;
    } else if (minWidth) {
      const { leftColumn, rightColumn } = widget;
      const columnSpace =
        (canvasWidth - FLEXBOX_PADDING * 2) / GridDefaults.DEFAULT_GRID_COLUMNS;
      if (columnSpace * (rightColumn - leftColumn) < minWidth) {
        widget.mobileLeftColumn = 0;
        widget.mobileRightColumn = Math.min(
          minWidth / columnSpace,
          GridDefaults.DEFAULT_GRID_COLUMNS,
        );
      }
    } else {
      widget.mobileLeftColumn = widget.leftColumn;
      widget.mobileRightColumn = widget.rightColumn;
    }
    if (
      widget.mobileTopRow === undefined ||
      widget.mobileBottomRow === undefined ||
      widget.mobileTopRow + widget.mobileBottomRow === 0
    ) {
      widget.mobileTopRow = widget.topRow;
      widget.mobileBottomRow = widget.bottomRow;
    }
    widgets = alterLayoutForMobile(
      widgets,
      child,
      (canvasWidth * (widget.mobileRightColumn || 1)) /
        GridDefaults.DEFAULT_GRID_COLUMNS,
      mainCanvasWidth,
    );
    widgets[child] = widget;
    widgets = updateWidgetPositions(
      widgets,
      child,
      true,
      mainCanvasWidth,
      firstTimeDSLUpdate,
    );
  }
  widgets = updateWidgetPositions(
    widgets,
    parentId,
    true,
    mainCanvasWidth,
    firstTimeDSLUpdate,
  );
  return widgets;
}

export function alterLayoutForDesktop(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  mainCanvasWidth: number,
  firstTimeDSLUpdate = false,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  const children = parent.children;

  if (!isStack(allWidgets, parent)) {
    return widgets;
  }
  if (!children || !children.length) {
    return widgets;
  }

  widgets = updateWidgetPositions(
    widgets,
    parentId,
    false,
    mainCanvasWidth,
    firstTimeDSLUpdate,
  );
  for (const child of children) {
    widgets = alterLayoutForDesktop(
      widgets,
      child,
      mainCanvasWidth,
      firstTimeDSLUpdate,
    );
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
  let flexLayerIndex = -1;
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
    flexLayerIndex = flexLayers.findIndex((layer: FlexLayer) => {
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
  return updatePositionsOfParentAndSiblings(
    widgets,
    parentId,
    flexLayerIndex,
    isMobile,
    mainCanvasWidth,
  );
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
  dimensionMap = DefaultDimensionMap,
): number | undefined {
  let fillLength = GridDefaults.DEFAULT_GRID_COLUMNS;
  let hugLength = 0,
    fillCount = 0;
  const { leftColumn: leftColumnMap, rightColumn: rightColumnMap } =
    dimensionMap;
  for (const child of layer.children) {
    const childWidget = allWidgets[child.id];
    if (!childWidget) {
      continue;
    }
    if (childWidget.responsiveBehavior !== ResponsiveBehavior.Fill) {
      hugLength += childWidget[rightColumnMap] - childWidget[leftColumnMap];
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
      [FlexLayerAlignment.None]: 0,
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
    [FlexLayerAlignment.None]: 0,
  };
}

export function getCanvasDimensions(
  canvas: FlattenedWidgetProps,
  widgets: CanvasWidgetsReduxState,
  mainCanvasWidth: number,
  isMobile: boolean,
): { canvasWidth: number; columnSpace: number } {
  const canvasWidth: number = getCanvasWidth(
    canvas,
    widgets,
    mainCanvasWidth,
    isMobile,
  );

  const columnSpace: number = canvasWidth / GridDefaults.DEFAULT_GRID_COLUMNS;

  return { canvasWidth: canvasWidth, columnSpace };
}

function getCanvasWidth(
  canvas: FlattenedWidgetProps,
  widgets: CanvasWidgetsReduxState,
  mainCanvasWidth: number,
  isMobile: boolean,
): number {
  if (!mainCanvasWidth) return 0;
  if (canvas.widgetId === MAIN_CONTAINER_WIDGET_ID)
    return mainCanvasWidth - getPadding(canvas);

  const stack = [];
  let widget = canvas;
  while (widget.parentId) {
    stack.push(widget);
    widget = widgets[widget.parentId];

    //stop at modal
    if (widget.type === "MODAL_WIDGET") {
      break;
    }
  }
  stack.push(widget);

  let width = mainCanvasWidth;

  //modal will be the total width instead of the mainCanvasWidth
  if (widget.type === "MODAL_WIDGET") {
    width = widget.width;
  }

  while (stack.length) {
    const widget = stack.pop();
    if (!widget) continue;
    const columns = getWidgetWidth(widget, isMobile);
    const padding = getPadding(widget);
    const factor = widget.detachFromLayout
      ? 1
      : columns / GridDefaults.DEFAULT_GRID_COLUMNS;
    width = width * factor - padding;
  }

  return width;
}

function getPadding(canvas: FlattenedWidgetProps): number {
  let padding = 0;
  if (canvas.widgetId === MAIN_CONTAINER_WIDGET_ID) {
    padding = FLEXBOX_PADDING * 2;
  } else if (canvas.type === "CONTAINER_WIDGET") {
    padding = (CONTAINER_GRID_PADDING + FLEXBOX_PADDING) * 2;
  } else if (canvas.isCanvas) {
    padding = CONTAINER_GRID_PADDING * 2;
  }

  if (canvas.noPad) {
    padding -= WIDGET_PADDING;
  }

  return padding;
}

/**
 * This method preserves the flexLayers of the parent canvas,
 * but only for the selected widgets
 * @param selectedWidgets
 * @param parentCanvas
 * @returns
 */
export function getFlexLayersForSelectedWidgets(
  selectedWidgets: string[],
  parentCanvas: FlattenedWidgetProps | undefined,
): FlexLayer[] {
  if (
    !parentCanvas ||
    !parentCanvas.flexLayers ||
    parentCanvas.flexLayers.length <= 0
  )
    return [];

  const currFlexLayers: FlexLayer[] = parentCanvas.flexLayers;

  const selectedFlexLayers: FlexLayer[] = [];

  for (const flexLayer of currFlexLayers) {
    const layerChildren = [];

    for (const layerChild of flexLayer.children) {
      if (selectedWidgets.indexOf(layerChild.id) > -1) {
        layerChildren.push(layerChild);
      }
    }

    if (layerChildren.length > 0) {
      selectedFlexLayers.push({ children: layerChildren });
    }
  }

  return selectedFlexLayers;
}

/**
 * This method helps in Converting the widgetId inside flexLayers
 * to the new corresponding widgetIds in widgetIdMap
 * @param flexLayers
 * @param widgetIdMap
 * @returns
 */
export function getNewFlexLayers(
  flexLayers: FlexLayer[],
  widgetIdMap: Record<string, string>,
) {
  const newFlexLayers: FlexLayer[] = [];

  for (const flexLayer of flexLayers) {
    const newChildren = [];

    for (const layerChild of flexLayer.children) {
      if (widgetIdMap[layerChild.id]) {
        newChildren.push({
          id: widgetIdMap[layerChild.id],
          align: layerChild.align,
        });
      }
    }
    newFlexLayers.push({ children: newChildren });
  }

  return newFlexLayers;
}

export function checkIsDSLAutoLayout(dsl: DSLWidget): boolean {
  return dsl.useAutoLayout && dsl.positioning === Positioning.Vertical;
}
