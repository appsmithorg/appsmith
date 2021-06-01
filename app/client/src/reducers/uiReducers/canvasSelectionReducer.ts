import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: CanvasSelectionState = {
  isDraggingForSelection: false,
};

export const canvasSelectionReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.START_CANVAS_SELECTION]: (state: CanvasSelectionState) => {
    state.isDraggingForSelection = true;
  },
  [ReduxActionTypes.STOP_CANVAS_SELECTION]: (state: CanvasSelectionState) => {
    state.isDraggingForSelection = false;
  },
});

export type CanvasSelectionState = {
  isDraggingForSelection: boolean;
};

export default canvasSelectionReducer;
