import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: CanvasSelectionState = {
  isDraggingForSelection: false,
};

export const canvasSelectionReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.START_CANVAS_SELECTION]: (
    state: CanvasSelectionState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    state.isDraggingForSelection = true;
    state.widgetId = action.payload.widgetId;
  },
  [ReduxActionTypes.STOP_CANVAS_SELECTION]: (state: CanvasSelectionState) => {
    state.isDraggingForSelection = false;
  },
});

export type CanvasSelectionState = {
  isDraggingForSelection: boolean;
  widgetId?: string;
};

export default canvasSelectionReducer;
