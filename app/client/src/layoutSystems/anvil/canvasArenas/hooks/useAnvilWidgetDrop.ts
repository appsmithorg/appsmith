import { GridDefaults } from "constants/WidgetConstants";
import {
  addNewAnvilWidgetAction,
  moveAnvilWidgets,
} from "layoutSystems/anvil/integrations/actions/draggingActions";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import type { AnvilDnDStates } from "./useAnvilDnDStates";

export const useAnvilWidgetDrop = (
  canvasId: string,
  anvilDragStates: AnvilDnDStates,
) => {
  const dispatch = useDispatch();
  const { dragDetails, dragMeta, isNewWidget } = anvilDragStates;
  const generateNewWidgetBlock = useCallback(() => {
    const { newWidget } = dragDetails;
    const isSectionWidget = newWidget.type === SectionWidget.type;

    return {
      width: (newWidget.rows / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.widgetId,
      parentId: canvasId,
      type: isSectionWidget ? ZoneWidget.type : newWidget.type,
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
