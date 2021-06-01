import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setCanvasSelectionStateAction = (start: boolean) => {
  return {
    type: start
      ? ReduxActionTypes.START_CANVAS_SELECTION
      : ReduxActionTypes.STOP_CANVAS_SELECTION,
  };
};
