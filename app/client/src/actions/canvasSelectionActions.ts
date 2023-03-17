import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { SelectedArenaDimensions } from "pages/common/CanvasArenas/CanvasSelectionArena";
import type { XYCord } from "pages/common/CanvasArenas/hooks/useRenderBlocksOnCanvas";

export const setCanvasSelectionFromEditor = (
  start: boolean,
  startPoints?: XYCord,
) => {
  return {
    type: start
      ? ReduxActionTypes.START_CANVAS_SELECTION_FROM_EDITOR
      : ReduxActionTypes.STOP_CANVAS_SELECTION_FROM_EDITOR,
    payload: {
      ...(start && startPoints ? { startPoints } : {}),
    },
  };
};

export const setCanvasSelectionStateAction = (
  start: boolean,
  widgetId: string,
) => {
  return {
    type: start
      ? ReduxActionTypes.START_CANVAS_SELECTION
      : ReduxActionTypes.STOP_CANVAS_SELECTION,
    payload: {
      widgetId,
    },
  };
};

export const selectAllWidgetsInAreaAction = (
  selectionArena: SelectedArenaDimensions,
  snapToNextColumn: boolean,
  snapToNextRow: boolean,
  isMultiSelect: boolean,
  snapSpaces: {
    snapColumnSpace: number;
    snapRowSpace: number;
  },
): ReduxAction<any> => {
  return {
    type: ReduxActionTypes.SELECT_WIDGETS_IN_AREA,
    payload: {
      selectionArena,
      snapToNextColumn,
      snapToNextRow,
      isMultiSelect,
      snapSpaces,
    },
  };
};
