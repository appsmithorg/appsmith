import { AppState } from "ce/reducers";
import { FLEXBOX_PADDING, GridDefaults } from "constants/WidgetConstants";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import {
  AlignmentColumnInfo,
  FlexBoxAlignmentColumnInfo,
  FlexLayer,
  LayerChild,
} from "utils/autoLayout/autoLayoutTypes";
import { getAlignmentColumnInfo } from "utils/autoLayout/AutoLayoutUtils";
import { getIsMobile } from "./mainCanvasSelectors";

export const getFlexLayers = (parentId: string) => {
  return createSelector(getWidgets, (widgets): FlexLayer[] => {
    const parent = widgets[parentId];
    if (!parent) return [];
    return parent?.flexLayers || [];
  });
};

export const getSiblingCount = (widgetId: string, parentId: string) => {
  return createSelector(getFlexLayers(parentId), (flexLayers): number => {
    if (!flexLayers) return -1;
    const selectedLayer = flexLayers?.find((layer: FlexLayer) =>
      layer.children?.some((child: LayerChild) => child.id === widgetId),
    );
    if (!selectedLayer) return -1;
    return selectedLayer.children?.length;
  });
};

export const getLayerIndex = (widgetId: string, parentId: string) => {
  return createSelector(
    getFlexLayers(parentId),
    (layers: FlexLayer[]): number => {
      if (!layers) return -1;
      const selectedLayer = layers.find((layer: FlexLayer) =>
        layer.children.some((child: LayerChild) => child.id === widgetId),
      );
      if (!selectedLayer) return -1;
      return selectedLayer.children?.findIndex(
        (child: LayerChild) => child.id === widgetId,
      );
    },
  );
};

export const isCurrentCanvasDragging = (widgetId: string) => {
  return createSelector(
    (state: AppState) => state.ui.widgetDragResize.dragDetails,
    (dragDetails): boolean => {
      return dragDetails?.draggedOn === widgetId;
    },
  );
};

export const getParentOffsetTop = (widgetId: string) =>
  createSelector(getWidgets, getIsMobile, (widgets, isMobile): number => {
    const widget = widgets[widgetId];
    if (!widget || !widget.parentId) return 0;
    const parent = widgets[widget.parentId];
    const top =
      isMobile && parent.mobileTopRow !== undefined
        ? parent.mobileTopRow
        : parent.topRow;
    return top * GridDefaults.DEFAULT_GRID_ROW_HEIGHT + FLEXBOX_PADDING;
  });

export const getAlignmentColumns = (widgetId: string, layerIndex: number) =>
  createSelector(
    getWidgets,
    getIsMobile,
    getFlexLayers(widgetId),
    (widgets, isMobile, flexLayers): AlignmentColumnInfo => {
      const layer: FlexLayer = flexLayers[layerIndex];
      return getAlignmentColumnInfo(widgets, layer, isMobile);
    },
  );

export const getColumnsForAllLayers = (widgetId: string) =>
  createSelector(
    getWidgets,
    getIsMobile,
    getFlexLayers(widgetId),
    (widgets, isMobile, flexLayers): FlexBoxAlignmentColumnInfo => {
      const res: { [key: number]: AlignmentColumnInfo } = {};
      if (!flexLayers || !flexLayers.length) return res;
      for (const [index, layer] of flexLayers.entries()) {
        const info = getAlignmentColumnInfo(widgets, layer, isMobile);
        res[index] = info;
      }
      return res;
    },
  );
