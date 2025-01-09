import type { ReduxAction } from "./ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type { SelectedArenaDimensions } from "layoutSystems/fixedlayout/editor/FixedLayoutCanvasArenas/CanvasSelectionArena";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
