import { AppState } from "ce/reducers";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { FLEXBOX_PADDING, GridDefaults } from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
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
