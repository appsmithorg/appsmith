import type { AppState } from "@appsmith/reducers";
import {
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { createSelector } from "reselect";
import { getCanvasAndMetaWidgets } from "sagas/selectors";
import type {
  AlignmentColumnInfo,
  FlexBoxAlignmentColumnInfo,
  FlexLayer,
  LayerChild,
} from "utils/autoLayout/autoLayoutTypes";
import {
  getAlignmentColumnInfo,
  getLayerIndexOfWidget,
} from "utils/autoLayout/AutoLayoutUtils";
import { getIsAutoLayoutMobileBreakPoint } from "./editorSelectors";
import WidgetFactory from "utils/WidgetFactory";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { getCanvasWidgets, getWidgetPositions } from "./entitiesSelector";
import { getLeftColumn } from "utils/autoLayout/flexWidgetUtils";
import type { AlignWidgetTypes } from "widgets/constants";

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
  state.ui.layoutConversion.snapshotDetails?.lastUpdatedTime;

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

export const hasFillWidgetSelector = (layer: FlexLayer) =>
  createSelector(getCanvasAndMetaWidgets, (widgets): boolean => {
    return layer.children.some((child: LayerChild) => {
      const widget = widgets[child.id];
      return (
        widget &&
        WidgetFactory.widgetConfigMap.get(widget.type)?.responsiveBehavior ===
          ResponsiveBehavior.Fill
      );
    });
  });

export const getAutoLayoutCanvasMetaWidth = (
  state: AppState,
  canvasId: string,
) => state.ui.autoLayoutCanvasMetaWidth[canvasId] || 0;

export const getAutoLayoutParentCanvasMetaWidth = (widgetId: string) =>
  createSelector(
    getCanvasWidgets,
    (state: AppState) => state.ui.autoLayoutCanvasMetaWidth,
    (widgets, autoLayoutCanvasMetaWidth) => {
      const widget = widgets[widgetId];

      const parentId = widget?.parentId;

      return parentId && autoLayoutCanvasMetaWidth[parentId]
        ? autoLayoutCanvasMetaWidth[parentId]
        : autoLayoutCanvasMetaWidth[MAIN_CONTAINER_WIDGET_ID]
        ? autoLayoutCanvasMetaWidth[MAIN_CONTAINER_WIDGET_ID]
        : 0;
    },
  );

export const getLayerInformation = (widgetId: string) =>
  createSelector(
    getCanvasWidgets,
    getWidgetPositions,
    (widgets, widgetPositions) => {
      const widget = widgets[widgetId];
      if (!widget || !widget?.parentId) return {};
      const layer = (() => {
        const parent = widgets[widget?.parentId];
        if (!parent) return {};
        const flexLayers = parent.flexLayers;
        const layerIndex = getLayerIndexOfWidget(flexLayers, widgetId);
        if (layerIndex === -1) return {};
        return flexLayers[layerIndex];
      })();
      const computedAlignment = (() => {
        const centerColumn = GridDefaults.DEFAULT_GRID_COLUMNS / 2;
        const leftColumn = getLeftColumn(widget, false);
        return leftColumn > centerColumn ? "end" : "start";
      })();
      const GapBetweenWidgets = 4;
      const layerWidthInPixelsWithoutCurrWidget = layer?.children?.reduce(
        (
          width: number,
          eachWidget: {
            id: string;
            align: AlignWidgetTypes;
          },
        ) => {
          if (eachWidget.id === widgetId) return width;

          const widget = widgets[eachWidget.id];
          const widgetPosition = widgetPositions[eachWidget.id];
          if (widget && widgetPosition) {
            const widgetWithInPixels = widgetPosition.width;
            // const {
            //   minWidth,
            // }: { [key in keyof MinMaxSize]: number | undefined } =
            //   getWidgetMinMaxDimensionsInPixel(
            //     { type: widget.type },
            //     mainCanvasProps.width || 1,
            //   );
            // if (widgetWithInPixels < (minWidth || 0)) {
            //   widgetWithInPixels = minWidth || 0;
            // }
            width += widgetWithInPixels;
          }
          return width;
        },
        (layer.children.length - 1) * GapBetweenWidgets,
      );

      const fillWidgetsFilter = (each: any) => {
        const currentWidget = widgets[each.id];
        return (
          currentWidget &&
          currentWidget?.responsiveBehavior === ResponsiveBehavior.Fill &&
          !(
            currentWidget.topRow >= widget.bottomRow ||
            currentWidget.bottomRow <= widget.topRow
          )
        );
      };
      const allFillWidgets =
        !!layer && layer?.children?.length
          ? layer.children.filter(fillWidgetsFilter)
          : [];
      const hasFillChild = allFillWidgets.length > 0;
      return {
        computedAlignment,
        hasFillChild,
        layerWidthInPixelsWithoutCurrWidget,
      };
    },
  );
