import { GridDefaults } from "constants/WidgetConstants";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { getAutoLayoutCanvasMetaWidth } from "selectors/autoLayoutSelectors";
import { getDimensionMap } from "selectors/editorSelectors";
import {
  calculateLayerMinWidth,
  getLayerIndexOfWidget,
} from "utils/autoLayout/AutoLayoutUtils";

export const useLayerInfoHook = (
  widgetId: string,
  parentId: string,
  isMobile: boolean,
  mainCanvasWidth: number,
) => {
  const dimensionMap = useSelector(getDimensionMap);
  const { leftColumn: leftColumnMap } = dimensionMap;
  const allWidgets = useSelector(getWidgets);
  const parentWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(state, parentId),
  );
  const { computedAlignment, layer, layerWidthInPixels } = useMemo(() => {
    const widget = allWidgets[widgetId];
    const layer = (() => {
      if (!widget || !widget?.parentId) return {};
      const parent = allWidgets[widget?.parentId];
      if (!parent) return {};
      const flexLayers = parent.flexLayers;
      const layerIndex = getLayerIndexOfWidget(flexLayers, widgetId);
      if (layerIndex === -1) return {};
      return flexLayers[layerIndex];
    })();
    const computedAlignment = (() => {
      const centerColumn = GridDefaults.DEFAULT_GRID_COLUMNS / 2;
      const leftColumn = widget[leftColumnMap];
      return leftColumn > centerColumn ? "end" : "start";
    })();
    const layerWidthInPixels = calculateLayerMinWidth(
      layer,
      allWidgets,
      isMobile,
      parentWidth,
      mainCanvasWidth,
    );
    return { computedAlignment, layer, layerWidthInPixels };
  }, [allWidgets, leftColumnMap, isMobile, mainCanvasWidth]);
  return { computedAlignment, layer, layerWidthInPixels };
};
