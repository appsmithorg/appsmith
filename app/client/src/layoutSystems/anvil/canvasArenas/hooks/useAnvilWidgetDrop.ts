import { GridDefaults } from "constants/WidgetConstants";
import {
  addNewAnvilWidgetAction,
  moveAnvilWidgets,
} from "layoutSystems/anvil/integrations/actions/draggingActions";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AnvilDnDStates } from "./useAnvilDnDStates";
import { anvilWidgets } from "widgets/anvil/constants";

export const useAnvilWidgetDrop = (
  canvasId: string,
  anvilDragStates: AnvilDnDStates,
) => {
  const dispatch = useDispatch();
  const { dragDetails, dragMeta, isNewWidget } = anvilDragStates;
  const generateNewWidgetBlock = useCallback(() => {
    const { newWidget } = dragDetails;
    const isSectionWidget = newWidget.type === anvilWidgets.SECTION_WIDGET;

    return {
      width: (newWidget.rows / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.widgetId,
      parentId: canvasId,
      type: isSectionWidget ? anvilWidgets.ZONE_WIDGET : newWidget.type,
    };
  }, [dragDetails]);
  return (renderedBlock: AnvilHighlightInfo) => {
    if (isNewWidget) {
      const newWidgetBlock = generateNewWidgetBlock();
      dispatch(
        addNewAnvilWidgetAction(newWidgetBlock, renderedBlock, dragMeta),
      );
    } else {
      dispatch(
        moveAnvilWidgets(
          renderedBlock,
          anvilDragStates.draggedBlocks,
          dragMeta,
        ),
      );
    }
  };
};
