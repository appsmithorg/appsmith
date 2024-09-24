import type { AppState } from "ee/reducers";
import { FLEXBOX_PADDING, GridDefaults } from "constants/WidgetConstants";
import { createSelector } from "reselect";
import { getCanvasAndMetaWidgets } from "sagas/selectors";
import type {
  AlignmentColumnInfo,
  FlexBoxAlignmentColumnInfo,
} from "layoutSystems/autolayout/utils/types";
import { getAlignmentColumnInfo } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import { getIsAutoLayoutMobileBreakPoint } from "./editorSelectors";
import type {
  FlexLayer,
  LayerChild,
} from "layoutSystems/autolayout/utils/types";

export const getIsCurrentlyConvertingLayout = (state: AppState) =>
  state.ui.layoutConversion.isConverting;

export const getFlexLayers = (parentId: string) => {
  return createSelector(getCanvasAndMetaWidgets, (widgets): FlexLayer[] => {
    const parent = widgets[parentId];

    if (!parent) return [];

    return parent?.flexLayers || [];
  });
};

export const getSnapshotUpdatedTime = (state: AppState) =>
  state.ui.layoutConversion.snapshotDetails?.updatedTime;

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

export const getTotalTopOffset = (widgetId: string) => {
  return createSelector(
    getCanvasAndMetaWidgets,
    getIsAutoLayoutMobileBreakPoint,
    (widgets, isMobile): number => {
      let widget = widgets[widgetId];

      if (!widget) return 0;

      let offset = 0;

      while (widget.parentId) {
        const parent = widgets[widget.parentId];
        const top =
          isMobile && parent.mobileTopRow !== undefined
            ? parent.mobileTopRow
            : parent.topRow;

        offset += top * GridDefaults.DEFAULT_GRID_ROW_HEIGHT + FLEXBOX_PADDING;

        if (parent.type === "TABS_WIDGET" && parent?.shouldShowTabs)
          offset += GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 4; // 4 rows for tabs header

        widget = parent;
      }

      return offset;
    },
  );
};

export const getParentOffsetTop = (widgetId: string) =>
  createSelector(
    getCanvasAndMetaWidgets,
    getIsAutoLayoutMobileBreakPoint,
    (widgets, isMobile): number => {
      const widget = widgets[widgetId];

      if (!widget || !widget.parentId) return 0;

      const parent = widgets[widget.parentId];
      const top =
        isMobile && parent.mobileTopRow !== undefined
          ? parent.mobileTopRow
          : parent.topRow;

      return top * GridDefaults.DEFAULT_GRID_ROW_HEIGHT + FLEXBOX_PADDING;
    },
  );

export const getAlignmentColumns = (widgetId: string, layerIndex: number) =>
  createSelector(
    getCanvasAndMetaWidgets,
    getIsAutoLayoutMobileBreakPoint,
    getFlexLayers(widgetId),
    (widgets, isMobile, flexLayers): AlignmentColumnInfo => {
      const layer: FlexLayer = flexLayers[layerIndex];

      return getAlignmentColumnInfo(widgets, layer, isMobile);
    },
  );

export const getColumnsForAllLayers = (widgetId: string) =>
  createSelector(
    getCanvasAndMetaWidgets,
    getIsAutoLayoutMobileBreakPoint,
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
