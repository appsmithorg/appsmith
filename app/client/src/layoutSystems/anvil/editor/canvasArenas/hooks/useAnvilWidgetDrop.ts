import { GridDefaults } from "constants/WidgetConstants";
import {
  addNewAnvilWidgetAction,
  moveAnvilWidgets,
} from "layoutSystems/anvil/integrations/actions/draggingActions";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AnvilDnDListenerStates } from "./useAnvilDnDListenerStates";
import { anvilWidgets } from "ee/modules/ui-builder/ui/wds/constants";

export const useAnvilWidgetDrop = (
  canvasId: string,
  anvilDragStates: AnvilDnDListenerStates,
) => {
  const dispatch = useDispatch();
  const {
    dragDetails,
    draggedBlocks,
    dragMeta,
    isNewWidget,
    layoutElementPositions,
  } = anvilDragStates;
  const generateNewWidgetBlock = useCallback(() => {
    const { newWidget } = dragDetails;
    const isSectionWidget = newWidget.type === anvilWidgets.SECTION_WIDGET;

    return {
      width: (newWidget.rows / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.widgetId,
      parentId: canvasId,
      type: isSectionWidget ? anvilWidgets.ZONE_WIDGET : newWidget.type,
      detachFromLayout: !!newWidget.detachFromLayout,
    };
  }, [dragDetails]);

  return (renderedBlock: AnvilHighlightInfo) => {
    if (isNewWidget) {
      const newWidgetBlock = generateNewWidgetBlock();

      dispatch(
        addNewAnvilWidgetAction(newWidgetBlock, renderedBlock, dragMeta),
      );
    } else {
      const sortDraggedBlocksByPosition = draggedBlocks.sort((a, b) => {
        const aPos = layoutElementPositions[a.widgetId];
        const bPos = layoutElementPositions[b.widgetId];

        // sort by left then top
        if (aPos.left === bPos.left) {
          return aPos.top - bPos.top;
        }

        return aPos.left - bPos.left;
      });

      dispatch(
        moveAnvilWidgets(renderedBlock, sortDraggedBlocksByPosition, dragMeta),
      );
    }
  };
};
